import * as _ from "lodash";
import * as moment from "moment";
import * as ApiT from "../lib/apiT";
import { updateEventLabels } from "../lib/event-labels";
import { QueryFilter, stringify } from "../lib/event-queries";
import { GenericPeriod, toDays, fromDates } from "../lib/period";
import { ok, ready, StoreMap, StoreData } from "./data-status";

// Stored query result
export interface QueryResult {
  query: QueryFilter; // Original query
  eventIds: string[]; // The result
  updatedOn: Date;    // For timed invalidation purposes
  invalid?: boolean;  // For forced invalidation
}

// Map from days since epoch to hashed query id to query result
export type EventsQueryState = Array<{
  [index: string]: StoreData<QueryResult>;
}>;

export type EventMap = StoreMap<ApiT.GenericCalendarEvent>;

export interface EventsState {
  // groupId to another map
  groupEvents: {
    [index: string]: EventMap;
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

export interface EventsUpdateAction {
  type: "GROUP_EVENTS_UPDATE";
  groupId: string;
  eventIds: string[];
  addLabels?: ApiT.LabelInfo[];
  rmLabels?: ApiT.LabelInfo[];
}

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

  switch (action.dataType) {
    case "FETCH_QUERY_START":
      reduceFetchQueryRequest(queryDays(), action);
      break;
    case "FETCH_QUERY_END":
      reduceFetchQueryResponse(queryDays(), eventMap(), action);
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
  let { groupId } = action;
  let eventsMap = state.groupEvents[groupId] || {};
  let queryDays = state.groupEventQueries[groupId] || [];

  // These should both be partial but index signature on array type is weird
  let eventsMapUpdate: Partial<EventMap> = {};
  let queryDaysUpdate: EventsQueryState = [];

  _.each(action.eventIds, (id) => {
    let event = eventsMap[id];
    if (ready(event)) {
      eventsMapUpdate[event.id] = reduceEventUpdate(event, action);

      /*
        Mark each day touched by this event for query invalidation. Don't
        actually invalidate just yet to avoid duplication if event days
        overlap.
      */
      let period = fromDates("day",
        moment(event.start).toDate(),
        moment(event.end).toDate());

      _.each(_.range(period.start, period.end + 1), (day) => {
        queryDaysUpdate[day] = {};
      });
    }
  });

  // Actual invalidation of each query day
  for (let i in queryDaysUpdate) {
    queryDaysUpdate[i] = _.mapValues(queryDays[i],
      (v, k) => ready(v) ? { ...v, invalid: true } : v
    );
  }

  let update: Partial<EventsState> = {
    groupEvents: {
      ...state.groupEvents,
      [groupId]: { ...eventsMap, ...eventsMapUpdate }
    },

    groupEventQueries: {
      ...state.groupEventQueries,
      [groupId]: mergeQueryStates(queryDays, queryDaysUpdate)
    }
  };
  return _.extend({}, state, update);
}

// Update a single event based on action
function reduceEventUpdate(
  event: ApiT.GenericCalendarEvent,
  action: EventsUpdateAction
) {
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
  return { ...event, labels, hashtags };
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
    groupEventQueries: {}
  };
}

