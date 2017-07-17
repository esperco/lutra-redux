/*
  Group event handlers.

  Most of these handlers use a single queue per group to manage all
  group-related API calls. This is to prevent a race condition between editing
  an event and re-fetching that event before the edit saves (thereby
  cloberring any edited data).

  Note that a single queue processing may involve multiple API calls if they
  may be safely parallelized, but for simplicity's sake, we wait for all API
  calls to resolve before processing the next set of calls in the queue.
*/

import * as ApiT from "../lib/apiT";
import * as _ from "lodash";
import { setGroupLabels } from "./groups";
import { startGroupCalc } from "./group-calcs";
import { ApiSvc } from "../lib/api";
import { updateLabelList, useRecurringLabels } from "../lib/event-labels";
import { QueryFilter, stringify, toAPI } from "../lib/event-queries";
import { GenericPeriod, Period, bounds, toDays } from "../lib/period";
import { QueueMap } from "../lib/queue";
import { NavSvc } from "../lib/routing";
import { LoginState } from "../lib/login";
import { useRecurringPref as useRecurringFeedback } from "../lib/feedback";
import { useRecurringPref as useRecurringTimebombs } from "../lib/timebomb";
import { OrderedSet, compactObject, hasTag } from "../lib/util";
import { ready, ok } from "../states/data-status";
import { GroupState, GroupUpdateAction } from "../states/groups";
import { CalcStartAction } from "../states/group-calcs";
import {
  EventsState, EventsDataAction, EventsUpdateAction,
  EventsInvalidatePeriodAction, QueryMap
} from "../states/events";
import { QueryCalcTask } from "../tasks/group-query-calc"


/* ---------------------------------------------
  Types for queued requests.
--------------------------------------------- */

interface LabelRequest {
  type: "LABEL";
  calgroupType: "group"; // Team not supported yet
  setLabels: {
    id: string;
    labels?: string[];
    hidden?: boolean;
  }[];
  predictLabels: string[];
  deps: {
    Svcs: ApiSvc;
  };
}

// Stage1 timebombs
interface SetTimebombRequest {
  type: "SET_TIMEBOMB";
  calgroupType: "group"|"team";
  eventId: string;
  value: boolean;
  deps: {
    Svcs: ApiSvc;
  }
}

// Stage0 timebombs
interface SetTimebombPrefRequest {
  type: "SET_TIMEBOMB_PREF";
  calgroupType: "group"|"team";
  eventId: string;
  value: boolean;
  deps: {
    Svcs: ApiSvc;
  }
}

interface SetFeedbackPrefRequest {
  type: "SET_FEEDBACK_PREF";
  calgroupType: "group"|"team";
  eventId: string;
  value: boolean;
  deps: {
    Svcs: ApiSvc;
  }
}

type PushRequest =
  LabelRequest|
  SetTimebombRequest|
  SetTimebombPrefRequest|
  SetFeedbackPrefRequest;

interface QueryRequest {
  type: "FETCH_QUERY";
  calgroupType: "group"|"team";
  period: GenericPeriod;
  query: QueryFilter;
  deps: {
    Svcs: ApiSvc;
    dispatch: (a: EventsDataAction) => any;
  };
}

interface IdRequest {
  type: "FETCH_ID";
  calgroupType: "group"|"team";
  eventId: string;
  deps: {
    Svcs: ApiSvc;
    dispatch: (a: EventsDataAction) => any;
  };

  // Opt callback if event.id fetched differs from what is fetched.
  // See description for fetchById
  onNewId?: (eventId: string) => void;
}

type FetchRequest = (
  QueryRequest|IdRequest
) & {
  priority: number; // Higher priority requests get processed first
};

type QueueRequest = PushRequest|FetchRequest;



/* ---------------------------------------------
  Queue processor helper functions
--------------------------------------------- */

/*
  Processor for our queue. We first process all pending requests that might
  modify data being fetched (so labels first).
*/
export function processQueueRequest(
  calgroupId: string,
  queue: QueueRequest[]
): Promise<QueueRequest[]> {
  let pushRequests: PushRequest[] = [];
  let fetchRequests: FetchRequest[] = [];
  _.each(queue, (r) => {
    isPushRequest(r) ? pushRequests.push(r) : fetchRequests.push(r)
  });

  if (pushRequests.length) {
    return processPushRequests(calgroupId, pushRequests)
      .then((req: QueueRequest[]) => req.concat(fetchRequests));
  }

  return processFetchRequests(calgroupId, fetchRequests);
}

export function isPushRequest(r: QueueRequest): r is PushRequest {
  return [
    "LABEL",
    "SET_TIMEBOMB",
    "SET_TIMEBOMB_PREF",
    "SET_FEEDBACK_PREF"
  ].includes(r.type);
}

/*
  Different push request types don't run the risk of clobbering each other, so
  separate by type and run in parallel.
*/
export function processPushRequests(
  calgroupId: string,
  queue: PushRequest[]
): Promise<PushRequest[]> {
  let labelReqs: LabelRequest[] = [];
  let timebombReqs: SetTimebombRequest[] = [];
  let timebombPrefReqs: SetTimebombPrefRequest[] = [];
  let feedbackPrefReqs: SetFeedbackPrefRequest[] = [];
  _.each(queue, (req) => {
    switch (req.type) {
      case "LABEL":
        labelReqs.push(req); break;
      case "SET_TIMEBOMB":
        timebombReqs.push(req); break;
      case "SET_TIMEBOMB_PREF":
        timebombPrefReqs.push(req); break;
      case "SET_FEEDBACK_PREF":
        feedbackPrefReqs.push(req); break;
    }
  });

  return Promise.all([
    processLabelRequests(calgroupId, labelReqs),
    processTimebombRequests(calgroupId, timebombReqs),
    processTimebombPrefRequests(calgroupId, timebombPrefReqs),
    processFeedbackPrefRequests(calgroupId, feedbackPrefReqs)
  ]).then(() => []);
}

/*
  Merge all of the hashtag and set_predict requests so we can post in as
  few API calls as possible.
*/
export function processLabelRequests(
  calgroupId: string,
  queue: LabelRequest[],
): Promise<any> {
  let last = _.last(queue);
  if (! last) return Promise.resolve();
  let { Api } = last.deps.Svcs;

  let setLabels: { [id: string]: ApiT.EventLabels } = {};
  let predictLabels = new OrderedSet<string>([], _.identity);

  // Left to right, override previous results with new ones
  _.each(queue, (q) => {
    _.each(q.setLabels, (s) => {

      /*
        Hidden status + labels are mutually exclusive. Hidden takes precedence.
        Remove labels if hidden.
      */
      setLabels[s.id] = compactObject({
        id: s.id,
        labels: s.hidden ? undefined : s.labels,
        hidden: _.isUndefined(s.hidden) && s.labels ? false : s.hidden
      });

    });
    _.each(q.predictLabels, (id) => predictLabels.push(id));
  });

  return Api.setPredictGroupLabels(calgroupId, {
    set_labels: _.values(setLabels),
    predict_labels: predictLabels.toList()
  });
}

/*
  Batch all timebomb Stage1 actions  in single API call and dispatch when done.
*/
export function processTimebombRequests(
  calgroupId: string,
  reqs: SetTimebombRequest[]
): Promise<any> {
  let last = _.last(reqs);
  if (! last) return Promise.resolve();
  let { calgroupType } = last;
  let { Svcs } = last.deps;

  // Left to right, more recent timebomb request for eventId overrides older.
  let tbStates: Record<string, boolean> = {};
  reqs.forEach((r) => tbStates[r.eventId] = r.value);

  return Svcs.Api.batch(() => {
    let promises: Promise<any>[] = [];
    _.each(tbStates, (confirm, eventId) => {
      if (eventId && confirm) {
        let apiFn = calgroupType === "group" ?
          Svcs.Api.confirmGroupEvent :
          Svcs.Api.confirmTeamEvent;
        promises.push(apiFn(calgroupId, eventId));
      }
      else if (eventId && !confirm) {
        let apiFn = calgroupType === "group" ?
          Svcs.Api.unconfirmGroupEvent :
          Svcs.Api.unconfirmTeamEvent;
        promises.push(apiFn(calgroupId, eventId));
      }
    });
    return Promise.all(promises);
  });
}

/*
  Batch all timebomb prefs in single API call and dispatch when done.
*/
export function processTimebombPrefRequests(
  calgroupId: string,
  reqs: SetTimebombPrefRequest[]
): Promise<any> {
  let last = _.last(reqs);
  if (! last) return Promise.resolve();
  let { calgroupType } = last;
  let { Svcs } = last.deps;

  // Left to right, more recent feedback request for eventId overrides older.
  let tbPrefs: Record<string, boolean> = {};
  reqs.forEach((r) => tbPrefs[r.eventId] = r.value);

  return Svcs.Api.batch(() => {
    let promises: Promise<any>[] = [];
    _.each(tbPrefs, (value, eventId) => {
      let apiFn = calgroupType === "group" ?
        Svcs.Api.setGroupTimebomb : Svcs.Api.setTeamTimebomb;
      promises.push(apiFn(calgroupId, eventId, value));
    });
    return Promise.all(promises);
  });
}

/*
  Batch all feedback settings in single API call and dispatch when done.
*/
export function processFeedbackPrefRequests(
  calgroupId: string,
  reqs: SetFeedbackPrefRequest[]
): Promise<any> {
  let last = _.last(reqs);
  if (! last) return Promise.resolve();
  let { calgroupType } = last;
  let { Svcs } = last.deps;

  // Left to right, more recent feedback request for eventId overrides older.
  let fbPrefs: Record<string, boolean> = {};
  reqs.forEach((r) => fbPrefs[r.eventId] = r.value);

  return Svcs.Api.batch(() => {
    let promises: Promise<any>[] = [];
    _.each(fbPrefs, (value, eventId) => {
      let apiFn = calgroupType === "group" ?
        Svcs.Api.setGroupFeedbackPref : Svcs.Api.setTeamFeedbackPref;
      promises.push(apiFn(calgroupId, eventId, value));
    });
    return Promise.all(promises);
  });
}

/*
  Process fetch requests baesd on priority. Should use timestamp as priority
  so newer fetch requests (i.e. what the user is probably currently looking
  at) gets processed first.
*/
export function processFetchRequests(
  calgroupId: string,
  queue: FetchRequest[]
): Promise<FetchRequest[]> {
  queue = _.sortBy(queue, (q) => -q.priority);
  let first = queue[0];
  if (! first) return Promise.resolve([]);

  switch (first.type) {
    case "FETCH_QUERY":
      return processQueryRequest(calgroupId, first, first.deps)
        .then(() => queue.slice(1));
    case "FETCH_ID":
      return processIdRequest(calgroupId, first, first.deps)
        .then(() => queue.slice(1));
  }
}

// Process a single query request
export function processQueryRequest(
  calgroupId: string,
  req: QueryRequest,
  deps: {
    dispatch: (a: EventsDataAction) => any;
    Svcs: ApiSvc
  }
): Promise<void> {
  let { period, query } = req;
  let props = { calgroupId, period, query };
  let [start, end] = bounds(period);
  let request = toAPI(start, end, query);
  let apiFn = req.calgroupType === "group" ?
    deps.Svcs.Api.postForGroupEvents :
    deps.Svcs.Api.postForTeamEvents;

  return apiFn(props.calgroupId, request).then(
    (result) => {
      /*
        NB: We currently have to sort through each calendar result in
        result and merge, but ideally server should just return a
        single list of events here.
      */
      let events = result.events || [];
      events.sort(sortFn);

      deps.dispatch({
        type: "EVENTS_DATA",
        dataType: "FETCH_QUERY_END",
        events, ...props
      });
    },

    // Dispatch error action otherwise
    (err) => {
      deps.dispatch({
        type: "EVENTS_DATA",
        dataType: "FETCH_QUERY_FAIL",
        ...props
      });
    }
  );
}

export function processIdRequest(
  calgroupId: string,
  req: IdRequest,
  deps: {
    dispatch: (a: EventsDataAction) => any;
    Svcs: ApiSvc
  }
): Promise<void> {
  let apiFn = req.calgroupType === "group" ?
    deps.Svcs.Api.getGroupEvent :
    deps.Svcs.Api.getTeamEvent;

  return apiFn(calgroupId, req.eventId).then((e) => {
    // Mismatched ID -> callback (e.g. redirect if necessary)
    if (e && e.id !== req.eventId && req.onNewId) {
      // Additional dispatch to correct ID because we don't want a flash of
      // something like "Event Not Found" when switching IDs
      deps.dispatch({
        type: "EVENTS_DATA",
        dataType: "FETCH_IDS_START",
        calgroupId,
        eventIds: [e.id]
      });
      req.onNewId(e.id);
    }

    // If ID mis-match, has the effect of setting old ID to error state (
    // (which is fine, since it'll trigger a re-fetch whenever user hits back)
    deps.dispatch({
      type: "EVENTS_DATA",
      dataType: "FETCH_IDS_END",
      calgroupId,
      eventIds: [req.eventId],
      events: e ? [e] : []
    });
  });
}

// Use in sorting function to sort based on start, then end times
function sortFn(e1: ApiT.GenericCalendarEvent, e2: ApiT.GenericCalendarEvent) {
  let startE1 = new Date(e1.start);
  let startE2 = new Date(e2.start);
  let endE1 = new Date(e1.end);
  let endE2 = new Date(e2.end);
  let startDiff = startE1.getTime() - startE2.getTime();
  return startDiff != 0 ? startDiff :
         endE1.getTime() - endE2.getTime();
}

// Actual queue map object (using groupId as a key)
export const EventQueues = new QueueMap<QueueRequest>(processQueueRequest);


/* ---------------------------------------------
  Actual handler functions called via routing
  or React event callbacks
--------------------------------------------- */

/*
  Enqueues a fetch request. Divides the request up into smaller chunks
  (if applicable).
*/
export function fetchEvents(props: {
  calgroupId: string;
  calgroupType: "group"|"team";
  period: GenericPeriod;
  query: QueryFilter;
}, deps: {
  dispatch: (a: EventsDataAction) => any;
  state: EventsState;
  Svcs: ApiSvc;
  Conf?: { cacheDuration?: number; maxDaysFetch?: number; }
}): Promise<any> {
  let periods = rangesToUpdate(props, deps);
  if (periods.length) {
    deps.dispatch({
      type: "EVENTS_DATA",
      dataType: "FETCH_QUERY_START",
      calgroupId: props.calgroupId,
      query: props.query,
      periods
    });
  }

  /*
    If nothing to queue, return promise dependent on other tasks in queue
    since tasks in queue may contain calls to fetch data for this period.
  */
  if (_.isEmpty(periods)) {
    return EventQueues.get(props.calgroupId).promise();
  }

  let priority = (new Date()).getTime();
  return Promise.all(_.map(periods, (period) =>
    EventQueues.get(props.calgroupId).enqueue({
      type: "FETCH_QUERY",
      calgroupType: props.calgroupType,
      query: props.query,
      period, deps, priority
    })
  ));
}

/*
  Returns a list of periods for which we should (re-)fetch an event query.
  Returns an empty list if nothing to do.
*/
function rangesToUpdate(props: {
  calgroupId: string;
  period: GenericPeriod;
  query: QueryFilter;
}, deps: {
  state: EventsState;
  Conf?: { cacheDuration?: number; maxDaysFetch?: number; }
}): Period<"day">[] {
  let period = toDays(props.period);

  // maxDays -> divide into chunks
  if (deps.Conf && deps.Conf.maxDaysFetch) {
    let ret: Period<"day">[] = [];
    for (let i = period.start; i <= period.end; i += deps.Conf.maxDaysFetch) {
      let p = rangeToUpdate({ ...props,
        period: {
          interval: "day",
          start: i,
          end: Math.min(i + deps.Conf.maxDaysFetch - 1, period.end)
        }
      }, deps);
      if (p) {
        ret.push(p);
      }
    }
    return ret;
  }

  // No maxDays -> single period
  else {
    let ret = rangeToUpdate({ ...props, period }, deps);
    return ret ? [ret] : [];
  }
}

/*
  Evaluate (and trim) a particular period we're fetching for. Returns
  null if no need to fetch. Otherwise, returns the minimum subset of a period
  for which a fetch is necessary.
*/
function rangeToUpdate(props: {
  calgroupId: string;
  period: Period<"day">;
  query: QueryFilter;
}, deps: {
  state: EventsState;
  Conf?: { cacheDuration?: number; maxDaysFetch?: number; }
}): Period<"day">|null {
  let { calgroupId, period, query } = props;
  let { state, Conf } = deps;
  let { start, end } = toDays(period);
  let queryKey = stringify(query);
  let queryDays = state.eventQueries[calgroupId];
  if (queryDays) {
    let minDay: number|undefined;
    for (let i = start; i <= end; i++) {
      if (invalidDay(queryKey, queryDays[i], Conf)) {
        minDay = i;
        break;
      }
    }
    if (typeof minDay === "undefined") { return null; }

    let maxDay = minDay;
    for (let i = end; i > minDay; i--) {
      if (invalidDay(queryKey, queryDays[i], Conf)) {
        maxDay = i;
        break;
      }
    }
    return { interval: "day", start: minDay, end: maxDay };
  }
  return props.period;
}

// For any given query-day combination, do we need to refetch?
function invalidDay(
  queryKey: string,
  queryMap?: QueryMap,
  Conf?: { cacheDuration?: number }
) {
  if (! queryMap) {
    return true;
  }

  let queryData = queryMap[queryKey];
  if (! ok(queryData)) {
    return true;
  }

  if (ready(queryData)) {
    if (queryData.invalid) {
      return true;
    }

    if (Conf && _.isNumber(Conf.cacheDuration) &&
        queryData.updatedOn.getTime() + Conf.cacheDuration <
          (new Date()).getTime()
    ) {
      return true;
    }
  }
  return false;
}


/* Fetch events by an ID */

export function fetchById(props: {
  calgroupId: string;
  calgroupType: "group"|"team";
  eventId: string;
}, deps: {
  dispatch: (a: EventsDataAction) => any;
  state: EventsState;
  Svcs: ApiSvc;
}, opts: {
  /*
    Callback if the group ID we fetch is different from the one we specified.
    This can happen because we may fetch a single non-merged event and
    get back the merged group event, which has a different ID.
  */
  onNewId?: (eventId: string) => void;

  // Force fetch even if already in progress
  force?: boolean;
} = {}) {
  /*
    Check if fetch already in progress or if we have data already
    Don't do anything if so (unless force is on)
  */
  let eventMap = deps.state.events[props.calgroupId] || {};
  if (!opts.force && ok(eventMap[props.eventId])) {
    return Promise.resolve();
  }

  // Dispatch fetching message
  deps.dispatch({
    type: "EVENTS_DATA",
    dataType: "FETCH_IDS_START",
    calgroupId: props.calgroupId,
    eventIds: [props.eventId]
  });

  /*
    Indvidual event fetches should be high priority (since they should
    be less work than batch requests) - multiply time to ensure higher
    than query requests.
  */
  let priority = (new Date()).getTime() * 2;
  let queue = EventQueues.get(props.calgroupId);
  return queue.enqueue({
    type: "FETCH_ID",
    calgroupType: props.calgroupType,
    eventId: props.eventId,
    onNewId: opts.onNewId,
    priority, deps
  });
}


/*
  Toggle a label for a given set of events. Adds to group label if applicable.
*/
export function setGroupEventLabels(props: {
  groupId: string;
  eventIds: string[];

  // Leave undefined to confirm existing label
  label?: ApiT.LabelInfo;
  active?: boolean;
  hidden?: boolean;

  // Passive confirmation
  passive?: boolean;

  // If we have a query + period context, we can refresh the current calc
  context?: {
    query: QueryFilter;
    period: GenericPeriod;
  };
}, deps: {
  dispatch: (a: EventsUpdateAction|GroupUpdateAction|CalcStartAction) => any;
  state: EventsState & GroupState;
  Svcs: ApiSvc;
  postTask: (x: QueryCalcTask) => any;
}, opts: {
  forceInstance?: boolean;
} = {}) {
  let soloIds = new OrderedSet<string>([], _.identity);
  let recurringIds = new OrderedSet<string>([], _.identity);

  // For label API call
  let request: LabelRequest = {
    type: "LABEL",
    calgroupType: "group",
    setLabels: [],
    predictLabels: [],
    deps
  };

  // Apply label change to each event in list
  _.each(props.eventIds, (id) => {
    let event = (deps.state.events[props.groupId] || {})[id];
    if (ready(event)) {
      let apiId: string; // ID to use for API call

      // Sort based on recurrence
      if (!opts.forceInstance && useRecurringLabels(event)) {
        recurringIds.push(event.recurring_event_id);
        apiId = event.recurring_event_id;
      } else {
        soloIds.push(event.id);
        apiId = event.id;
      }

      // Only confirm if event needs confirming (also ignore instance mode)
      if (
        props.label ||
        ! _.isUndefined(props.hidden) ||
        ! event.labels_confirmed ||
        opts.forceInstance
      ) {

        // Add or remove labels from each event
        let labels = updateLabelList(event.labels || [], props.label ? {
          add: props.active ? [props.label] : [],
          rm: props.active ? [] : [props.label]
        } : {});

        let hidden = _.isUndefined(props.hidden) ?
          (props.label ? false : event.hidden) : props.hidden;

        // Set complete set of labels in request (this may clobber other
        // requests but that's the nature of the API for now)
        request.setLabels.push({
          id: apiId,
          labels: _.map(labels, (l) => l.original),
          hidden
        });
      }
    }
  });

  // Dispatch changes to store
  deps.dispatch(compactObject({
    type: "EVENTS_UPDATE" as "EVENTS_UPDATE",
    calgroupId: props.groupId,
    eventIds: soloIds.toList(),
    recurringEventIds: recurringIds.toList(),
    addLabels: props.label && props.active ? [props.label] : [],
    rmLabels: !props.label || props.active ? [] : [props.label],
    hidden: props.label && _.isUndefined(props.hidden) ? false : props.hidden,
    passive: props.passive
  }));

  // Also need to set new group labels (but not for hashtags)
  var groupLabelPromise: Promise<any> = Promise.resolve();
  if (props.label && props.active && props.label.normalized[0] !== "#") {
    groupLabelPromise = setGroupLabels({
      groupId: props.groupId,
      addLabels: [props.label]
    }, deps);
  }

  // API queue
  let queue = EventQueues.get(props.groupId);

  // Apply group labels + queue up event request
  let ret = Promise.all([
    groupLabelPromise,
    queue.enqueue(request)
  ]);

  // Update calc if necessary
  if (props.context) {
    startGroupCalc({
      groupId: props.groupId,
      ...props.context
    }, {
      dispatch: deps.dispatch,
      postTask: deps.postTask,
      promise: ret
    });
  }

  return ret;
}

export function toggleTimebomb(props: {
  calgroupId: string;
  calgroupType: "group"|"team";
  eventId: string;
  value: boolean;
}, deps: {
  dispatch: (a: EventsUpdateAction) => any;
  state: EventsState & LoginState;
  Svcs: ApiSvc;
}, opts: {
  forceInstance?: boolean;
} = {}) {
  let event = (deps.state.events[props.calgroupId] || {})[props.eventId];
  if (ready(event) && event.timebomb) {
    let { dispatch, state } = deps;
    let queue = EventQueues.get(props.calgroupId);
    if (hasTag("Stage0", event.timebomb)) {
      let eventId = opts.forceInstance || !useRecurringTimebombs(event) ?
        event.id : (event.recurring_event_id || event.id);
      let recurring = eventId === event.recurring_event_id;
      deps.dispatch({
        type: "EVENTS_UPDATE",
        calgroupId: props.calgroupId,
        eventIds: recurring ? [] : [eventId],
        recurringEventIds: recurring ? [eventId] : [],
        timebombPref: props.value
      });
      return queue.enqueue({
        type: "SET_TIMEBOMB_PREF",
        calgroupType: props.calgroupType,
        eventId,
        value: props.value,
        deps
      });
    }

    else if (hasTag("Stage1", event.timebomb) && state.login) {
      let uid = state.login.uid;
      let contributors = event.timebomb[1].contributors
        .filter((c) => c.uid !== uid);
      if (props.value) {
        contributors.push({
          uid,
          contributes: true,
          last_edit: (new Date()).toISOString()
        });
      }

      // NB: Unlike Stage0 prefs, Stage1 update is always for instance,
      // not recurrence
      dispatch({
        type: "EVENTS_UPDATE",
        calgroupId: props.calgroupId,
        eventIds: [props.eventId],
        timebomb: ["Stage1", {
          ...event.timebomb[1],
          contributors
        }]
      });
      return queue.enqueue({
        type: "SET_TIMEBOMB",
        calgroupType: props.calgroupType,
        eventId: props.eventId,
        value: props.value,
        deps
      });
    }
  }
  return Promise.resolve();
}

export function toggleFeedback(props: {
  calgroupId: string;
  calgroupType: "group"|"team";
  eventId: string;
  value: boolean;
}, deps: {
  dispatch: (a: EventsUpdateAction) => any;
  state: EventsState;
  Svcs: ApiSvc;
}, opts: {
  forceInstance?: boolean;
} = {}) {
  let event = (deps.state.events[props.calgroupId] || {})[props.eventId];
  if (ready(event)) {
    let eventId = opts.forceInstance || !useRecurringFeedback(event) ?
      event.id : (event.recurring_event_id || event.id);
    let recurring = eventId === event.recurring_event_id;
    deps.dispatch({
      type: "EVENTS_UPDATE",
      calgroupId: props.calgroupId,
      eventIds: recurring ? [] : [eventId],
      recurringEventIds: recurring ? [eventId] : [],
      feedbackPref: props.value
    });

    let queue = EventQueues.get(props.calgroupId);
    return queue.enqueue({
      type: "SET_FEEDBACK_PREF",
      calgroupType: props.calgroupType,
      eventId,
      value: props.value,
      deps
    });
  }

  return Promise.resolve();
}

// Refresh current view with a given set of periods
export function refresh(props: {
  calgroupId: string,
  period: GenericPeriod
}, deps: {
  dispatch: (a: EventsInvalidatePeriodAction) => any;
  Svcs: NavSvc;
}) {
  deps.dispatch({
    type: "EVENTS_INVALIDATE_PERIOD",
    ...props
  });
  deps.Svcs.Nav.refresh();
}