import * as _ from "lodash";
import * as moment from "moment";
import * as ApiT from "../lib/apiT";
import { AllSomeNone } from "../lib/asn";
import { GenericPeriod, toDays, fromDates } from "../lib/period";
import { ok, ready, StoreMap, StoreData } from "./data-status";
import * as stringify from "json-stable-stringify";

/*
  A query for a list of events -- time period and groupId are omitted here
  because we nest down from groupID to each day to the query itself.
*/
export interface Query {
  labels: AllSomeNone;
}

// Stored query result
export interface QueryResult {
  query: Query;       // Original query
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

export interface EventsPushAction {
  type: "GROUP_EVENTS_DATA";
  dataType: "PUSH";
  groupId: string;
  events: ApiT.GenericCalendarEvent[];
}

export interface EventsFetchQueryRequestAction {
  type: "GROUP_EVENTS_DATA";
  dataType: "FETCH_QUERY_START";
  groupId: string;
  period: GenericPeriod;
  query: Query;
}

export interface EventsFetchQueryResponseAction {
  type: "GROUP_EVENTS_DATA";
  dataType: "FETCH_QUERY_END";
  groupId: string;
  period: GenericPeriod;
  query: Query;
  events: ApiT.GenericCalendarEvent[];
}

export interface EventsFetchQueryFailAction {
  type: "GROUP_EVENTS_DATA";
  dataType: "FETCH_QUERY_FAIL";
  groupId: string;
  period: GenericPeriod;
  query: Query;
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
  EventsFetchIdsResponseAction|
  EventsPushAction;

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
    default: // PUSH
      reducePush(queryDays(), eventMap(), action);
  }

  return state;
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

function reducePush(
  queryDays: EventsQueryState,
  eventMap: StoreMap<ApiT.GenericCalendarEvent>,
  action: EventsPushAction
) {
  _.each(action.events, (event) => {
    // Invalidate queries on each day event touches
    let period = fromDates("day",
      moment(event.start).toDate(),
      moment(event.end).toDate());

    _.each(_.range(period.start, period.end + 1), (day) => {
       let queryMap = queryDays[day] = _.clone(queryDays[day]) || {};
       _.each(queryMap, (v, k) => {
         if (k && ready(v)) {
           v = queryMap[k] = _.clone(v);
           v.invalid = true;
         }
       });
    });

    // Update actual event
    eventMap[event.id] = event;
  });
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

