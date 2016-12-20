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

export interface EventsState {
  // groupId to another map
  groupEvents: {
    [index: string]: StoreMap<ApiT.GenericCalendarEvent>;
  };

  // groupId to another map
  groupEventQueries: {
    [index: string]: EventsQueryState;
  };
}

export interface EventsFetchRequestAction {
  type: "GROUP_EVENTS_DATA";
  dataType: "FETCH_START";
  groupId: string;
  period: GenericPeriod;
  query: Query;
}

export interface EventsPushAction {
  type: "GROUP_EVENTS_DATA";
  dataType: "PUSH";
  groupId: string;
  events: ApiT.GenericCalendarEvent[];
}

export interface EventsFetchResponseAction {
  type: "GROUP_EVENTS_DATA";
  dataType: "FETCH_END";
  groupId: string;
  period: GenericPeriod;
  query: Query;
  events: ApiT.GenericCalendarEvent[];
}

export interface EventsFetchFailAction {
  type: "GROUP_EVENTS_DATA";
  dataType: "FETCH_FAIL";
  groupId: string;
  period: GenericPeriod;
  query: Query;
}

export type EventsDataAction =
  EventsFetchRequestAction|
  EventsFetchResponseAction|
  EventsFetchFailAction|
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
    case "FETCH_START":
      reduceFetchRequest(queryDays(), action);
      break;
    case "FETCH_END":
      reduceFetchResponse(queryDays(), eventMap(), action);
      break;
    case "FETCH_FAIL":
      reduceFetchFail(queryDays(), action);
      break;
    default: // PUSH
      reducePush(queryDays(), eventMap(), action);
  }

  return state;
}

/* Below functions mutate -- assume already cloned from above for below */

function reduceFetchRequest(
  queryDays: EventsQueryState, action: EventsFetchRequestAction
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

function reduceFetchResponse(
  queryDays: EventsQueryState,
  eventMap: StoreMap<ApiT.GenericCalendarEvent>,
  action: EventsFetchResponseAction
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

function reduceFetchFail(
  queryDays: EventsQueryState,
  action: EventsFetchFailAction
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

export function initState(): EventsState {
  return {
    groupEvents: {},
    groupEventQueries: {}
  };
}

