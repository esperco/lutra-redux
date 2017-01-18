/*
  Store cached calculations on a bunch of group events. This code doesn't
  handle the actual calculations, just storage.
*/

import * as _ from "lodash";
import { GenericPeriod, PeriodParam } from "../lib/period";
import { QueryFilter, stringify } from "../lib/event-queries";
import { ok, StoreMap } from "./data-status";

/*
  The numbers we're calculating for a given set of events (identified by a
  query + period)
*/
export interface CalcResultsBase {
  seconds: number;
  eventCount: number;
  peopleSeconds: number;
  groupPeopleSeconds: number; // only counts guests that are group members
}

export interface CalcResults extends CalcResultsBase {
  labelResults: {
    [normalized: string]: CalcResultsBase;
  };
  unlabeledResult: CalcResultsBase;
}

export type CalcResultsState = StoreMap<CalcResults>;

export interface GroupCalcState {
  groupCalcs: {
    [groupId: string]: CalcResultsState;
  }
}

// Key used to map period + query to calc results
export function calcKey(period: GenericPeriod, query: QueryFilter) {
  return PeriodParam.toStr(period) + "|" + stringify(query);
}

export interface CalcStartAction {
  type: "GROUP_CALC_START";
  groupId: string;
  query: QueryFilter;
  period: GenericPeriod;
}

export interface CalcEndAction {
  type: "GROUP_CALC_END";
  groupId: string;
  query: QueryFilter;
  period: GenericPeriod;
  results: CalcResults;
}

export type CalcAction = CalcStartAction|CalcEndAction;

export function calcReducer<S extends GroupCalcState>(
  state: S, action: CalcAction
): S {
  let groupCalcs = state.groupCalcs[action.groupId] || {};
  let key = calcKey(action.period, action.query);
  let current = groupCalcs[key];
  let next: typeof current;

  if (action.type === "GROUP_CALC_START") {
    if (ok(current)) { return state; }
    next = "FETCHING";
  }

  else { // GROUP_CALC_END
    next = action.results;
  }

  let newCalcs: GroupCalcState = {
    groupCalcs: {
      ...state.groupCalcs,

      [action.groupId]: {
        ...groupCalcs, [key]: next
      }
    }
  };
  return _.extend({}, state, newCalcs);
}

export function initState(): GroupCalcState {
  return {
    groupCalcs: {}
  };
}
