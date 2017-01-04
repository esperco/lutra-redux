import * as _ from "lodash";
import * as moment from "moment";
import * as ApiT from "../lib/apiT";
import { updateEventLabels, useRecurringLabels } from "../lib/event-labels";
import { QueryFilter, stringify } from "../lib/event-queries";
import { GenericPeriod, toDays, fromDates, index } from "../lib/period";
import { ok, ready, StoreMap, StoreData } from "./data-status";
import { LoginState } from "../lib/login";

// Stored query result
export interface QueryResult {
  query: QueryFilter; // Original query
  eventIds: string[]; // The result
  updatedOn: Date;    // For timed invalidation purposes
  invalid?: boolean;  // For forced invalidation
}

// Map from days since epoch to hashed query id to query result
export interface QueryMap {
  [index: string]: StoreData<QueryResult>
};

export type EventsQueryState = QueryMap[];

export type EventMap = StoreMap<ApiT.GenericCalendarEvent>;

// Map from recurring_event_id to all instances we've encountered thus far
export interface RecurringEventMap {
  [recurringId: string]: Record<string, true>;
}

export interface EventsState {
  // groupId to another map
  groupEvents: {
    [index: string]: EventMap;
  };

  // groupId to another map
  groupRecurringEvents: {
    [index: string]: RecurringEventMap;
  };

  // groupId to another map
  groupEventQueries: {
    [index: string]: EventsQueryState;
  };
}

export interface EventsFetchQueryRequestAction {
  type: "GROUP_EVENTS_DATA";
  dataType: "FETCH_QUERY_START";
  groupId: string;
  period: GenericPeriod;
  query: QueryFilter;
}

export interface EventsFetchQueryResponseAction {
  type: "GROUP_EVENTS_DATA";
  dataType: "FETCH_QUERY_END";
  groupId: string;
  period: GenericPeriod;
  query: QueryFilter;
  events: ApiT.GenericCalendarEvent[];
}

export interface EventsFetchQueryFailAction {
  type: "GROUP_EVENTS_DATA";
  dataType: "FETCH_QUERY_FAIL";
  groupId: string;
  period: GenericPeriod;
  query: QueryFilter;
}

export interface EventsFetchIdsRequestAction {
  type: "GROUP_EVENTS_DATA";
  dataType: "FETCH_IDS_START";
  groupId: string;
  eventIds: string[];
}

export interface EventsFetchIdsResponseAction {
  type: "GROUP_EVENTS_DATA";
  dataType: "FETCH_IDS_END";
  groupId: string;
  eventIds: string[];
  events: ApiT.GenericCalendarEvent[];
}

export type EventsDataAction =
  EventsFetchQueryRequestAction|
  EventsFetchQueryResponseAction|
  EventsFetchQueryFailAction|
  EventsFetchIdsRequestAction|
  EventsFetchIdsResponseAction;

export interface EventsInvalidatePeriodAction {
  type: "GROUP_EVENTS_INVALIDATE_PERIOD";
  groupId: string;
  period: GenericPeriod;
}

export interface EventsUpdateAction {
  type: "GROUP_EVENTS_UPDATE";
  groupId: string;
  eventIds: string[];
  recurringEventIds?: string[];
  addLabels?: ApiT.LabelInfo[];
  rmLabels?: ApiT.LabelInfo[];
}

export interface EventCommentPostAction {
  type: "GROUP_EVENT_COMMENT_POST";
  commentId: string;
  eventId: string;
  groupId: string;
  text: string;
}

export interface EventCommentDeleteAction {
  type: "GROUP_EVENT_COMMENT_DELETE";
  commentId: string;
  eventId: string;
  groupId: string;
}

export type EventCommentAction =
  EventCommentPostAction|
  EventCommentDeleteAction;

export function eventsDataReducer<S extends EventsState> (
  state: S, action: EventsDataAction
) {
  state = _.clone(state);
  let queryDays = () => {
    state.groupEventQueries = _.clone(state.groupEventQueries);
    return (state.groupEventQueries[action.groupId] =
      _.clone(state.groupEventQueries[action.groupId]) || []);
  };
  let eventMap = () => {
    state.groupEvents = _.clone(state.groupEvents);
    return (state.groupEvents[action.groupId] =
      _.clone(state.groupEvents[action.groupId]) || {});
  };
  let recurringMap = () => {
    state.groupRecurringEvents = _.clone(state.groupRecurringEvents);
    return (state.groupRecurringEvents[action.groupId] =
      _.clone(state.groupRecurringEvents[action.groupId]) || {});
  };

  switch (action.dataType) {
    case "FETCH_QUERY_START":
      reduceFetchQueryRequest(queryDays(), action);
      break;
    case "FETCH_QUERY_END":
      reduceFetchQueryResponse(queryDays(), eventMap(), recurringMap(), action);
      break;
    case "FETCH_QUERY_FAIL":
      reduceFetchQueryFail(queryDays(), action);
      break;
    case "FETCH_IDS_START":
      reduceFetchIdsRequest(eventMap(), action);
      break;
    case "FETCH_IDS_END":
      reduceFetchIdsResponse(eventMap(), action);
      break;
  }

  return state;
}

export function eventsUpdateReducer<S extends EventsState>(
  state: S, action: EventsUpdateAction
): S {
  let { groupId, eventIds, recurringEventIds } = action;
  let eventsMap = state.groupEvents[groupId] || {};
  let eventsMapUpdate: Partial<EventMap> = {};
  let daysToUpdateMap: { [index: number]: true } = {};

  let setEventsToUpdate = (
    event?: StoreData<ApiT.GenericCalendarEvent>,
    recurring?: boolean
  ) => {
    if (ready(event)) {
      let newEvent = reduceEventUpdate(event, action, recurring);
      if (newEvent !== event) {
        eventsMapUpdate[event.id] = newEvent;
        setDaysToUpdate(daysToUpdateMap, event);
      }
    }
  };

  // Reduce recurring ids to individual ids and process
  _.each(recurringEventIds || [], (recurId) => {
    _.each(state.groupRecurringEvents[groupId][recurId], (v, k) => {
      if (v && k) {
        setEventsToUpdate(eventsMap[k], true);
      }
    });
  });

  // Update individual events
  _.each(eventIds, (id) => setEventsToUpdate(eventsMap[id]));

  let daysToUpdate = _(daysToUpdateMap).keys().map((n) => parseInt(n)).value();
  let update: Partial<EventsState> = {
    groupEvents: {
      ...state.groupEvents,
      [groupId]: { ...eventsMap, ...eventsMapUpdate }
    },

    // Actual invalidation happens here
    ...invalidateDays(state, action.groupId, daysToUpdate)
  };
  return _.extend({}, state, update);
}

/*
  Mark each day touched by this event for query invalidation. Don't
  actually invalidate just yet to avoid duplication if event days
  overlap.
*/
function setDaysToUpdate(
  updateMap: { [index: number]: true },
  event: ApiT.GenericCalendarEvent
) {
  let period = fromDates("day",
    moment(event.start).toDate(),
    moment(event.end).toDate());
  _.each(_.range(period.start, period.end + 1), (day) => {
    updateMap[day] = true;
  });
}

export function invalidatePeriodReducer<S extends EventsState>(
  state: S, action: EventsInvalidatePeriodAction
): S {
  let { groupId } = action;
  let { start, end } = toDays(action.period);

  /*
    Get earliest event on start day (if any) and latest event on end day
    (if any) and use those to see if we should invalidate beyond period.
  */
  _.each(state.groupEventQueries[groupId][start], (result) => {
    if (ready(result)) {
      let firstEvent: ApiT.GenericCalendarEvent|undefined;
      _.find(result.eventIds, (id) => {
        let event = (state.groupEvents[groupId] || {})[id];
        if (ready(event)) {
          firstEvent = event;
          return true;
        }
        return false;
      });

      if (firstEvent) {
        let day = index(moment(firstEvent.start).toDate(), 'day');
        start = Math.min(day, start);
      }
    }
  });

  // Do the same for the last event
  _.each(state.groupEventQueries[groupId][end], (result) => {
    if (ready(result)) {
      let lastEvent: ApiT.GenericCalendarEvent|undefined;
      _.findLast(result.eventIds, (id) => {
        let event = (state.groupEvents[groupId] || {})[id];
        if (ready(event)) {
          lastEvent = event;
          return true;
        }
        return false;
      });

      if (lastEvent) {
        let day = index(moment(lastEvent.end).toDate(), 'day');
        end = Math.max(day, end);
      }
    }
  });

  // Apply updated start and end days to invalidation
  let update = invalidateDays(state, groupId, _.range(start, end + 1));
  return _.extend({}, state, update);
}

// Invalidate each query on each of the specified days
function invalidateDays(
  state: EventsState, groupId: string, days: number[]
): Partial<EventsState> {
  let queryDays = state.groupEventQueries[groupId] || [];
  let queryDaysUpdate: EventsQueryState = [];
  _.each(days, (i) => {
    queryDaysUpdate[i] = _.mapValues(queryDays[i] || {},
      (v, k) => ready(v) ? { ...v, invalid: true } : v
    );
  });
  return {
    groupEventQueries: {
      ...state.groupEventQueries,
      [groupId]: mergeQueryStates(queryDays, queryDaysUpdate)
    }
  };
}

// Update a single event based on action
function reduceEventUpdate(
  event: ApiT.GenericCalendarEvent,
  action: EventsUpdateAction,
  recurring?: boolean
): ApiT.GenericCalendarEvent {
  // Don't update recurring labels if event doesn't have them
  if (recurring && !useRecurringLabels(event)) {
    return event;
  }

  // Labels
  let labels = event.labels || [];
  let hashtags = event.hashtags || [];
  if (action.addLabels || action.rmLabels) {
    let update = updateEventLabels(event, {
      add: action.addLabels,
      rm: action.rmLabels
    });
    labels = update.labels;
    hashtags = update.hashtags;
  }

  return {
    ...event,
    labels,
    hashtags,
    has_recurring_labels: !!recurring
  };
}

// Merges group event query day arrays, returns a new state
function mergeQueryStates(...states: EventsQueryState[]): EventsQueryState {
  let ret: EventsQueryState = [];
  _.each(states, (s) => {
    // Use normal iterator because of sparesly populated array
    for (let i in s) {
      ret[i] = s[i];
    }
  });
  return ret;
}

// Helper function to make query states for testing -- optionally merge w/
// existing state
export function makeQueryState(
  period: GenericPeriod,
  query: QueryFilter,
  eventIds: string[],
  addTo?: EventsQueryState)
{
  addTo = addTo || [];
  let { start, end } = toDays(period);
  let queryKey = stringify(query);
  for (let i = start; i <= end; i++) {
    let queryMap = addTo[i] = _.clone(addTo[i]) || {};
    queryMap[queryKey] = {
      query,
      eventIds,
      updatedOn: new Date()
    };
  }
  return addTo;
}

export function eventCommentPostReducer<S extends EventsState & LoginState>(
  state: S, action: EventCommentPostAction
): S {
  let { commentId, groupId, eventId, text } = action;
  let eventsMap = state.groupEvents[groupId] || {};
  let login = state.login;
  let eventsMapUpdate: Partial<EventMap> = {};
  let event = eventsMap[eventId];

  if (ready(event) && ready(login)) {
    let comments = _.concat(event.comments, {
      id: commentId,
      author: login.uid,
      upvoted_users: [],
      text: text,
      created: (new Date()).toISOString()
    });
    eventsMapUpdate[eventId] = { ...event, comments };
  }


  let update: Partial<EventsState> = {
    groupEvents: {
      ...state.groupEvents,
      [groupId]: { ...eventsMap, ...eventsMapUpdate }
    }
  };
  return _.extend({}, state, update);
}

export function eventCommentDeleteReducer<S extends EventsState>(
  state: S, action: EventCommentDeleteAction
): S {
  let { commentId, eventId, groupId } = action;
  let eventsMap = state.groupEvents[groupId] || {};
  let eventsMapUpdate: Partial<EventMap> = {};
  let event = eventsMap[eventId];

  if (ready(event)) {
    let comments = _.reject(event.comments, (c) => c.id === commentId);
    eventsMapUpdate[eventId] = { ...event, comments };
  }

  let update: Partial<EventsState> = {
    groupEvents: {
      ...state.groupEvents,
      [groupId]: { ...eventsMap, ...eventsMapUpdate }
    }
  }

  return _.extend({}, state, update);
}


/* Below functions mutate -- assume already cloned from above for below */

function reduceFetchQueryRequest(
  queryDays: EventsQueryState, action: EventsFetchQueryRequestAction
) {
  let days = toDays(action.period);
  let queryKey = stringify(action.query);
  for (let i = days.start; i <= days.end; i++) {
    let queryMap = queryDays[i] = _.clone(queryDays[i]) || {};
    if (! ok(queryMap[queryKey])) {
      queryMap[queryKey] = "FETCHING";
    }
  }
}

function reduceFetchQueryResponse(
  queryDays: EventsQueryState,
  eventMap: StoreMap<ApiT.GenericCalendarEvent>,
  recurringMap: RecurringEventMap,
  action: EventsFetchQueryResponseAction
) {
  // Create a list for each event - day combo
  let days = toDays(action.period);
  let queryKey = stringify(action.query);
  let eventIdLists: string[][] = [];
  for (let i = days.start; i <= days.end; i++) {
    let queryMap = queryDays[i] = _.clone(queryDays[i]) || {};
    let eventIds = eventIdLists[i] = [];
    queryMap[queryKey] = {
      query: action.query,
      eventIds,
      updatedOn: new Date()
    };
  }

  // For each event ...
  _.each(action.events, (event) => {
    let period = fromDates("day",
      moment(event.start).toDate(),
      moment(event.end).toDate());

    // Add to list for each day it touches (if day is inside specified period)
    _.each(_.range(period.start, period.end + 1), (day) => {
      let eventIdList = eventIdLists[day];
      if (eventIdList) {
        eventIdList.push(event.id);
      }
    });

    // Update recurrences if applicable
    if (event.recurring_event_id) {
      recurringMap[event.recurring_event_id] = {
        ...recurringMap[event.recurring_event_id],
        [event.id]: true
      };
    }

    // Add actual event data too -- indexed by eventId
    eventMap[event.id] = event;
  });
}

function reduceFetchQueryFail(
  queryDays: EventsQueryState,
  action: EventsFetchQueryFailAction
) {
  let days = toDays(action.period);
  let queryKey = stringify(action.query);
  for (let i = days.start; i <= days.end; i++) {
    let queryMap = queryDays[i] = _.clone(queryDays[i]) || {};
    if (! ready(queryMap[queryKey])) {
      queryMap[queryKey] = "FETCH_ERROR";
    }
  }
}

function reduceFetchIdsRequest(
  eventMap: StoreMap<ApiT.GenericCalendarEvent>,
  action: EventsFetchIdsRequestAction
) {
  _.each(action.eventIds, (id) => {
    if (! ok(eventMap[id])) {
      eventMap[id] = "FETCHING";
    }
  });
}

function reduceFetchIdsResponse(
  eventMap: StoreMap<ApiT.GenericCalendarEvent>,
  action: EventsFetchIdsResponseAction
) {
  // Anything id in the list gets marked as error unless replaced by
  // actual data
  _.each(action.eventIds, (id) => {
    if (! ready(eventMap[id])) {
      eventMap[id] = "FETCH_ERROR";
    }
  });

  _.each(action.events, (e) => {
    eventMap[e.id] = e;
  });
}

export function initState(): EventsState {
  return {
    groupEvents: {},
    groupRecurringEvents: {},
    groupEventQueries: {}
  };
}

