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
import { OrderedSet, compactObject, hasTag } from "../lib/util";
import { ready, ok } from "../states/data-status";
import { GroupState, GroupUpdateAction } from "../states/groups";
import { CalcStartAction } from "../states/group-calcs";
import {
  EventsState, EventCommentAction, EventsDataAction, EventsUpdateAction,
  EventsInvalidatePeriodAction, QueryMap
} from "../states/group-events";
import { QueryCalcTask } from "../tasks/group-query-calc"


/* ---------------------------------------------
  Types for queued requests.
--------------------------------------------- */

interface LabelRequest {
  type: "LABEL";
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

interface CommentRequest {
  type: "COMMENT";
  eventId: string;
  text: string;
  deps: {
    Svcs: ApiSvc;
    dispatch: (a: EventCommentAction) => any;
  };
}

interface DeleteCommentRequest {
  type: "DELETE_COMMENT";
  commentId: string;
  deps: {
    Svcs: ApiSvc;
    dispatch: (a: EventCommentAction) => any;
  };
}

interface SetTimebombRequest {
  type: "SET_TIMEBOMB";
  eventId: string;
  value: boolean;
  deps: {
    Svcs: ApiSvc;
  }
}

type PushRequest = LabelRequest
  |CommentRequest
  |DeleteCommentRequest
  |SetTimebombRequest;

interface QueryRequest {
  type: "FETCH_QUERY";
  period: GenericPeriod;
  query: QueryFilter;
  deps: {
    Svcs: ApiSvc;
    dispatch: (a: EventsDataAction) => any;
  };
}

interface IdRequest {
  type: "FETCH_ID";
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
  modify data being fetched (so comments and labels first).
*/
export function processQueueRequest(
  groupId: string,
  queue: QueueRequest[]
): Promise<QueueRequest[]> {
  let pushRequests: PushRequest[] = [];
  let fetchRequests: FetchRequest[] = [];
  _.each(queue, (r) => {
    isPushRequest(r) ? pushRequests.push(r) : fetchRequests.push(r)
  });

  if (pushRequests.length) {
    return processPushRequests(groupId, pushRequests)
      .then((req: QueueRequest[]) => req.concat(fetchRequests));
  }

  return processFetchRequests(groupId, fetchRequests);
}

export function isPushRequest(r: QueueRequest): r is PushRequest {
  return _.includes([
    "LABEL",
    "COMMENT", "DELETE_COMMENT",
    "SET_TIMEBOMB"
  ], r.type);
}

/*
  Different push request types don't run the risk of clobbering each other, so
  separate by type and run in parallel.
*/
export function processPushRequests(
  groupId: string,
  queue: PushRequest[]
): Promise<PushRequest[]> {
  let labelReqs: LabelRequest[] = [];
  let commentReqs: CommentRequest[] = [];
  let deleteCommentReqs: DeleteCommentRequest[] = [];
  let timebombReqs: SetTimebombRequest[] = [];
  _.each(queue, (req) => {
    switch (req.type) {
      case "LABEL":
        labelReqs.push(req); break;
      case "COMMENT":
        commentReqs.push(req); break;
      case "DELETE_COMMENT":
        deleteCommentReqs.push(req); break;
      case "SET_TIMEBOMB":
        timebombReqs.push(req); break;
    }
  });

  return Promise.all([
    processLabelRequests(groupId, labelReqs),
    processCommentRequests(groupId, commentReqs),
    processDeleteCommentRequest(groupId, deleteCommentReqs),
    processTimebombRequests(groupId, timebombReqs)
  ]).then(() => []);
}

/*
  Merge all of the hashtag and set_predict requests so we can post in as
  few API calls as possible.
*/
export function processLabelRequests(
  groupId: string,
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

  return Api.setPredictGroupLabels(groupId, {
    set_labels: _.values(setLabels),
    predict_labels: predictLabels.toList()
  });
}

// Batch all comment posts in a single API call and dispatch when done
export function processCommentRequests(
  groupId: string,
  reqs: CommentRequest[]
): Promise<any> {
  let last = _.last(reqs);
  if (! last) return Promise.resolve();
  let { Svcs, dispatch } = last.deps;

  return Svcs.Api.batch(() => Promise.all(
    _.map(reqs, (r) =>
      Svcs.Api.postGroupEventComment(groupId, r.eventId, { body: r.text })
        .then((comment) => dispatch({
          type: "GROUP_EVENT_COMMENT_POST",
          groupId,
          eventId: r.eventId,
          commentId: comment.id,
          text: r.text
        }))
  )));
}

/*
  Batch all timebomb settings in single API call and dispatch when done.
*/
export function processTimebombRequests(
  groupId: string,
  reqs: SetTimebombRequest[]
): Promise<any> {
  let last = _.last(reqs);
  if (! last) return Promise.resolve();
  let { Svcs } = last.deps;

  // Left to right, more recent timebomb request for eventId overrides older.
  let tbStates: Record<string, boolean> = {};
  _.each(reqs, (r) => tbStates[r.eventId] = r.value);

  return Svcs.Api.batch(() => {
    let promises: Promise<any>[] = [];
    _.each(tbStates, (setTb, eventId) => {
      if (eventId) {
        promises.push(Svcs.Api.setGroupTimebomb(groupId, eventId, setTb));
      }
    });
    return Promise.all(promises);
  });
}

// Batch all comment deletes in a single API call
export function processDeleteCommentRequest(
  groupId: string,
  reqs: DeleteCommentRequest[]
): Promise<any> {
  let last = _.last(reqs);
  if (! last) return Promise.resolve();
  let { Api } = last.deps.Svcs;

  return Api.batch(() => Promise.all(_.map(reqs,
    (r) => Api.deleteGroupEventComment(groupId, r.commentId)
  )));
}

/*
  Process fetch requests baesd on priority. Should use timestamp as priority
  so newer fetch requests (i.e. what the user is probably currently looking
  at) gets processed first.
*/
export function processFetchRequests(
  groupId: string,
  queue: FetchRequest[]
): Promise<FetchRequest[]> {
  queue = _.sortBy(queue, (q) => -q.priority);
  let first = queue[0];
  if (! first) return Promise.resolve([]);

  switch (first.type) {
    case "FETCH_QUERY":
      return processQueryRequest(groupId, first, first.deps)
        .then(() => queue.slice(1));
    case "FETCH_ID":
      return processIdRequest(groupId, first, first.deps)
        .then(() => queue.slice(1));
  }
}

// Process a single query request
export function processQueryRequest(
  groupId: string,
  req: QueryRequest,
  deps: {
    dispatch: (a: EventsDataAction) => any;
    Svcs: ApiSvc
  }
): Promise<void> {
  let { period, query } = req;
  let props = { groupId, period, query };
  let [start, end] = bounds(period);
  let request = toAPI(start, end, query);

  return deps.Svcs.Api.postForGroupEvents(props.groupId, request).then(
    (result) => {
      /*
        NB: We currently have to sort through each calendar result in
        result and merge, but ideally server should just return a
        single list of events here.
      */
      let events: ApiT.GenericCalendarEvent[] = [];
      _.each(result, (v) => {
        events = events.concat(v.events);
      });
      events.sort(sortFn);

      deps.dispatch({
        type: "GROUP_EVENTS_DATA",
        dataType: "FETCH_QUERY_END",
        events, ...props
      });
    },

    // Dispatch error action otherwise
    (err) => {
      deps.dispatch({
        type: "GROUP_EVENTS_DATA",
        dataType: "FETCH_QUERY_FAIL",
        ...props
      });
    }
  );
}

export function processIdRequest(
  groupId: string,
  req: IdRequest,
  deps: {
    dispatch: (a: EventsDataAction) => any;
    Svcs: ApiSvc
  }
): Promise<void> {
  return deps.Svcs.Api.getGroupEvent(groupId, req.eventId).then((e) => {
    // Mismatched ID -> callback (e.g. redirect if necessary)
    if (e && e.id !== req.eventId && req.onNewId) {
      // Additional dispatch to correct ID because we don't want a flash of
      // something like "Event Not Found" when switching IDs
      deps.dispatch({
        type: "GROUP_EVENTS_DATA",
        dataType: "FETCH_IDS_START",
        groupId,
        eventIds: [e.id]
      });
      req.onNewId(e.id);
    }

    // If ID mis-match, has the effect of setting old ID to error state (
    // (which is fine, since it'll trigger a re-fetch whenever user hits back)
    deps.dispatch({
      type: "GROUP_EVENTS_DATA",
      dataType: "FETCH_IDS_END",
      groupId,
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
export function fetchGroupEvents(props: {
  groupId: string;
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
      type: "GROUP_EVENTS_DATA",
      dataType: "FETCH_QUERY_START",
      groupId: props.groupId,
      query: props.query,
      periods
    });
  }

  /*
    If nothing to queue, return promise dependent on other tasks in queue
    since tasks in queue may contain calls to fetch data for this period.
  */
  if (_.isEmpty(periods)) {
    return EventQueues.get(props.groupId).promise();
  }

  let priority = (new Date()).getTime();
  return Promise.all(_.map(periods, (period) =>
    EventQueues.get(props.groupId).enqueue({
      type: "FETCH_QUERY",
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
  groupId: string;
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
  groupId: string;
  period: Period<"day">;
  query: QueryFilter;
}, deps: {
  state: EventsState;
  Conf?: { cacheDuration?: number; maxDaysFetch?: number; }
}): Period<"day">|null {
  let { groupId, period, query } = props;
  let { state, Conf } = deps;
  let { start, end } = toDays(period);
  let queryKey = stringify(query);
  let queryDays = state.groupEventQueries[groupId];
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
  groupId: string;
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
  let eventMap = deps.state.groupEvents[props.groupId] || {};
  if (!opts.force && ok(eventMap[props.eventId])) {
    return Promise.resolve();
  }

  // Dispatch fetching message
  deps.dispatch({
    type: "GROUP_EVENTS_DATA",
    dataType: "FETCH_IDS_START",
    groupId: props.groupId,
    eventIds: [props.eventId]
  });

  /*
    Indvidual event fetches should be high priority (since they should
    be less work than batch requests) - multiply time to ensure higher
    than query requests.
  */
  let priority = (new Date()).getTime() * 2;
  let queue = EventQueues.get(props.groupId);
  return queue.enqueue({
    type: "FETCH_ID",
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
    setLabels: [],
    predictLabels: [],
    deps
  };

  // Apply label change to each event in list
  _.each(props.eventIds, (id) => {
    let event = (deps.state.groupEvents[props.groupId] || {})[id];
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
    type: "GROUP_EVENTS_UPDATE" as "GROUP_EVENTS_UPDATE",
    groupId: props.groupId,
    eventIds: soloIds.toList(),
    recurringEventIds: recurringIds.toList(),
    addLabels: props.label && props.active ? [props.label] : [],
    rmLabels: !props.label || props.active ? [] : [props.label],
    hidden: props.label && _.isUndefined(props.hidden) ? false : props.hidden
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
      ...deps,
      promise: ret
    });
  }

  return ret;
}

export function postGroupEventComment(props: {
  groupId: string;
  eventId: string;
  text: string;
}, deps: {
  dispatch: (a: EventCommentAction) => any;
  Svcs: ApiSvc;
}) {
  let queue = EventQueues.get(props.groupId);
  let { eventId, text } = props;
  return queue.enqueue({
    type: "COMMENT",
    eventId, text, deps
  });
}

export function deleteGroupEventComment(props: {
  groupId: string;
  eventId: string;
  commentId: string;
}, deps: {
  dispatch: (a: EventCommentAction) => any;
  Svcs: ApiSvc;
}) {
  deps.dispatch({
    type: "GROUP_EVENT_COMMENT_DELETE",
    ...props
  });

  let queue = EventQueues.get(props.groupId);
  return queue.enqueue({
    type: "DELETE_COMMENT",
    commentId: props.commentId,
    deps
  });
}

export function toggleTimebomb(props: {
  groupId: string;
  eventId: string;
  value: boolean;
}, deps: {
  dispatch: (a: EventsUpdateAction) => any;
  state: EventsState;
  Svcs: ApiSvc;
}) {
  let event = (deps.state.groupEvents[props.groupId] || {})[props.eventId];
  if (ready(event) && event.timebomb) {
    if (hasTag("Stage0", event.timebomb)) {
      deps.dispatch({
        type: "GROUP_EVENTS_UPDATE",
        groupId: props.groupId,
        eventIds: [props.eventId],
        timebomb: ["Stage0", {
          ...event.timebomb[1],
          set_timebomb: props.value
        }]
      });
    }
  }

  let queue = EventQueues.get(props.groupId);
  return queue.enqueue({
    type: "SET_TIMEBOMB",
    eventId: props.eventId,
    value: props.value,
    deps
  });
}

// Refresh current view with a given set of periods
export function refresh(props: {
  groupId: string,
  period: GenericPeriod
}, deps: {
  dispatch: (a: EventsInvalidatePeriodAction) => any;
  Svcs: NavSvc;
}) {
  deps.dispatch({
    type: "GROUP_EVENTS_INVALIDATE_PERIOD",
    ...props
  });
  deps.Svcs.Nav.refresh();
}