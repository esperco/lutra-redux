import * as ApiT from "../lib/apiT";
import * as _ from "lodash";
import { setGroupLabels } from "./groups";
import { ApiSvc } from "../lib/api";
import { updateEventLabels, useRecurringLabels } from "../lib/event-labels";
import { QueryFilter, stringify, toAPI } from "../lib/event-queries";
import { GenericPeriod, bounds, toDays, fromDates } from "../lib/period";
import { QueueMap } from "../lib/queue";
import { NavSvc } from "../lib/routing";
import { OrderedSet } from "../lib/util";
import { ready, ok } from "../states/data-status";
import { GroupState, GroupUpdateAction } from "../states/groups";
import {
  EventsState, EventCommentAction, EventsDataAction, EventsUpdateAction,
  EventsInvalidatePeriodAction, QueryMap
} from "../states/group-events";

export function fetchGroupEvents(props: {
  groupId: string;
  period: GenericPeriod;
  query: QueryFilter;
}, deps: {
  dispatch: (a: EventsDataAction) => any;
  state: EventsState;
  Svcs: ApiSvc;
  Conf?: { cacheDuration: number }
}): Promise<void> {
  let range = rangeToUpdate(props, deps);
  if (range) {
    let [start, end] = range;
    let period = fromDates(start, end);
    let request = toAPI(start, end, props.query);

    deps.dispatch({
      type: "GROUP_EVENTS_DATA",
      dataType: "FETCH_QUERY_START",
      ...props, period
    });

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
          events, ...props, period
        });
      },

      // Dispatch error action otherwise
      (err) => {
        deps.dispatch({
          type: "GROUP_EVENTS_DATA",
          dataType: "FETCH_QUERY_FAIL",
          ...props, period
        });
      }
    );
  }
  return Promise.resolve(undefined);
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

// Should we fetch event query again? If so, what date range should we fetch?
function rangeToUpdate(props: {
  groupId: string;
  period: GenericPeriod;
  query: QueryFilter;
}, deps: {
  state: EventsState;
  Conf?: { cacheDuration: number }
}): [Date, Date]|null {
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

    return bounds({ interval: "day", start: minDay, end: maxDay })
  }
  return bounds(props.period);
}

function invalidDay(
  queryKey: string,
  queryMap?: QueryMap,
  Conf?: { cacheDuration: number }
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


/* Fetch events by IDs */

// TODO -- Need API endpoint for this though
export function fetchByIds(props: {
  groupId: string;
  eventIds: string[];
}, deps: {
  dispatch: (a: EventsDataAction) => any;
  state: EventsState;
  Svcs: ApiSvc;
}) {

}


/* Labeling */

interface LabelRequest {
  setLabels: {
    id: string;
    labels?: string[];
    hashtags?: {
      hashtag: string;    // Original
      approved: boolean;
    }[];
    attended?: boolean;
  }[];
  predictLabels: string[];
  Svcs: ApiSvc;
}

export function processLabelRequests(
  groupId: string,
  queue: LabelRequest[],
) {
  let Svcs = _.last(queue).Svcs;
  let setHashtags: { [id: string]: {
    hashtag: string;    // Original
    approved: boolean;
  }[] } = {}
  let setLabels: { [id: string]: {
    id: string;
    labels?: string[];
    attended?: boolean;
  } } = {};
  let predictLabels: string[] = [];

  // Left to right, override previous results with new ones
  _.each(queue, (q) => {
    _.each(q.setLabels, (s) => {
      if (s.hashtags) {
        setHashtags[s.id] = s.hashtags;
      }
      if (s.labels) {
        setLabels[s.id] = {
          ...setLabels[s.id],
          id: s.id,
          labels: s.labels
        };
      }
      if (! _.isUndefined(s.attended)) {
        setLabels[s.id] = {
          ...setLabels[s.id],
          id: s.id,
          attended: s.attended
        };
      }
    });
    _.each(q.predictLabels, (id) => predictLabels.push(id));
  });

  /*
    API calls -- first hashtags, then labels, then clear queue.
    TODO: Ideally, we'd like to combine hashtag conf and label setting in one
    API call but that isn't available yet.
  */
  return Svcs.Api.batch(() => Promise.all(
    _.map(setHashtags,
      (h, eventId: string) => Svcs.Api.updateGroupHashtagStates(
        groupId, eventId, {
          hashtag_states: h
        })
    )
  )).then(() => Svcs.Api.setPredictGroupLabels(groupId, {
    set_labels: _.values(setLabels),
    predict_labels: _.uniq(predictLabels)
  })).then(() => []);
}

export const LabelQueues = new QueueMap<LabelRequest>(processLabelRequests);


/*
  Toggle a label for a given set of events. Adds to group label if applicable.
*/
export function setGroupEventLabels(props: {
  groupId: string;
  eventIds: string[];
  label?: ApiT.LabelInfo; // Leave undefined to confirm existing label
  active?: boolean;
}, deps: {
  dispatch: (a: EventsUpdateAction|GroupUpdateAction) => any;
  state: EventsState & GroupState;
  Svcs: ApiSvc;
}, opts: {
  forceInstance?: boolean;
} = {}) {
  let soloIds = new OrderedSet<string>([], _.identity);
  let recurringIds = new OrderedSet<string>([], _.identity);

  // For label API call
  let request: LabelRequest = {
    setLabels: [],
    predictLabels: [],
    Svcs: deps.Svcs
  };

  // Track if label actually updates for any event (vs. hashtag)
  var hashtagOnly = true;

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

      // Add or remove labels from each event
      let { hashtags, labels } = updateEventLabels(event, props.label ? {
        add: props.active ? [props.label] : [],
        rm: props.active ? [] : [props.label]
      } : {});

      // Flag if this is a hashtag (hashtag-only updates don't trigger
      // group label API call)
      let norm = props.label ? props.label.normalized : "";
      let isHashtag = !!_.find(event.hashtags,
        (h) => !h.label && h.hashtag.normalized === norm);
      hashtagOnly = hashtagOnly && isHashtag;

      // Set complete set of labels in request (this may clobber other
      // requests but that's the nature of the API for now)
      request.setLabels.push({
        id: apiId,
        labels: _.map(labels, (l) => l.original),
        hashtags: _.map(hashtags, (h) => ({
          hashtag: h.hashtag.original,
          approved: h.approved !== false // Implicit approval
        }))
      });
    }
  });

  // Dispatch changes to store
  deps.dispatch({
    type: "GROUP_EVENTS_UPDATE",
    groupId: props.groupId,
    eventIds: soloIds.toList(),
    recurringEventIds: recurringIds.toList(),
    addLabels: props.label && props.active ? [props.label] : [],
    rmLabels: !props.label || props.active ? [] : [props.label]
  });

  // Also need to set new group labels (but not for hashtags)
  var groupLabelPromise: Promise<any> = Promise.resolve();
  if (props.label && props.active && !hashtagOnly) {
    groupLabelPromise = setGroupLabels({
      groupId: props.groupId,
      addLabels: [props.label]
    }, deps);
  }

  // API queue
  let queue = LabelQueues.get(props.groupId);

  // Apply group labels first (actually a bug since we should be able to
  // run these in parallel but whatever).
  // TODO: Fix when API updated.
  return groupLabelPromise.then(() => queue.enqueue(request));
}

export function postGroupEventComment(props: {
  groupId: string;
  eventId: string;
  text: string;
}, deps: {
  dispatch: (a: EventCommentAction) => any;
  Svcs: ApiSvc;
}) {
  let { groupId, eventId, text } = props;
  let { dispatch, Svcs } = deps;

  return Svcs.Api.postGroupEventComment(groupId, eventId, { body: text })
    .then((comment) =>
      dispatch({
        type: "GROUP_EVENT_COMMENT_POST",
        commentId: comment.id,
        ...props
      })
    );
}

export function deleteGroupEventComment(props: {
  groupId: string;
  eventId: string;
  commentId: string;
}, deps: {
  dispatch: (a: EventCommentAction) => any;
  Svcs: ApiSvc;
}) {
  let { groupId, commentId } = props;
  let { dispatch, Svcs } = deps;

  dispatch({
    type: "GROUP_EVENT_COMMENT_DELETE",
    ...props
  });

  return Svcs.Api.deleteGroupEventComment(groupId, commentId);
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