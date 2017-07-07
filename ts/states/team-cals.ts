import * as ApiT from "../lib/apiT";
import { ok, StoreData } from "./data-status";
import { EventsState, resetForCalgroupId } from "./events";

export interface GenericCalendars {
  [index: string] : {
    available?: StoreData<ApiT.GenericCalendar[]>;
    selected?: StoreData<ApiT.GenericCalendar[]>;
  }
}

export interface TeamCalendarState {
  teamCalendars: GenericCalendars;
}

export interface TeamCalendarFetchRequestAction {
  type: "TEAM_CALENDAR_DATA";
  dataType: "FETCH_START";
  fetchType: "available"|"selected";
  teamId: string;
}

export interface TeamCalendarFetchResponseAction {
  type: "TEAM_CALENDAR_DATA";
  dataType: "FETCH_END";
  availableCalendars?: ApiT.GenericCalendars;
  selectedCalendars?: ApiT.GenericCalendars;
  teamId: string;
}

export type TeamCalendarDataAction =
  TeamCalendarFetchRequestAction|
  TeamCalendarFetchResponseAction;

export interface TeamCalendarUpdateAction {
  type: "TEAM_CALENDAR_UPDATE";
  teamId: string;
  selected?: ApiT.GenericCalendar[];
}

export function teamCalendarDataReducer<S extends TeamCalendarState> (
  state: S, action: TeamCalendarDataAction
) {
  let update: Partial<TeamCalendarState> = {};

  // If data start -- mark as fetching if none
  if (action.dataType === "FETCH_START") {
    let current = state.teamCalendars[action.teamId];
    if (action.fetchType === "available" &&
        !(current && ok(current.available))) {
      update.teamCalendars = {
        ...state.teamCalendars,
        [action.teamId]: {
          available: "FETCHING",
          selected: current ? current.selected : undefined
        }
      };
    } else if (action.fetchType === "selected" &&
               !(current && ok(current.selected))) {
      update.teamCalendars = {
        ...state.teamCalendars,
        [action.teamId]: {
          available: current ? current.available : undefined,
          selected: "FETCHING"
        }
      };
    }
  }

  // Else data ready
  else {

    // Anything id in the list gets marked as error unless replaced by
    // actual data
    let current = state.teamCalendars[action.teamId];
    if (action.dataType === "FETCH_END") {
      if (action.availableCalendars) {
        update.teamCalendars = {
          ...state.teamCalendars,
          [action.teamId]: {
            available: "FETCH_ERROR",
            selected: current.selected
          }
        };
      } else if (action.selectedCalendars) {
        update.teamCalendars = {
          ...state.teamCalendars,
          [action.teamId]: {
            available: current.available,
            selected: "FETCH_ERROR"
          }
        };
      }
    }
    if (action.availableCalendars) {
      update.teamCalendars = {
        ...state.teamCalendars,
        [action.teamId]: {
          available: action.availableCalendars.calendars,
          selected: current.selected
        }
      };
    } else if (action.selectedCalendars) {
      update.teamCalendars = {
        ...state.teamCalendars,
        [action.teamId]: {
          available: current.available,
          selected: action.selectedCalendars.calendars
        }
      };
    }
  }

  return Object.assign({}, state, update);
}

export function teamCalendarUpdateReducer
  <S extends TeamCalendarState & Partial<EventsState>>
(
  state: S, action: TeamCalendarUpdateAction
) {
  let { teamId } = action;
  let update: Partial<TeamCalendarState> = {};

  if (action.selected) {
    let current = state.teamCalendars[teamId];
    if (current) {
      update.teamCalendars = {
        ...state.teamCalendars,
        [teamId]: { ...current, selected: action.selected }
      };
    }
  }

  return Object.assign({}, state, resetForCalgroupId(teamId, state), update);
}

export function initState(): TeamCalendarState {
  return {
    teamCalendars: {}
  };
}
