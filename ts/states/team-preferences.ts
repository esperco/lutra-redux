import * as _ from "lodash";
import * as ApiT from "../lib/apiT";
import { ok, ready, StoreData } from "./data-status";
import { EventsState, resetForCalgroupId } from "./events";

export interface TeamPreferencesState {
  teamPreferences: Record<string, StoreData<ApiT.Preferences>>;
}

export interface FetchRequestAction {
  type: "TEAM_PREFERENCES_DATA";
  dataType: "FETCH_START";
  teamId: string;
}

export interface FetchResponseAction {
  type: "TEAM_PREFERENCES_DATA";
  dataType: "FETCH_END";
  teamId: string;
  preferences?: ApiT.Preferences;
}

export type DataAction = FetchRequestAction|FetchResponseAction;

export interface UpdateAction {
  type: "TEAM_PREFERENCES_UPDATE";
  teamId: string;
  preferences: Partial<ApiT.Preferences>;
}

export function dataReducer<S extends TeamPreferencesState> (
  state: S, action: DataAction
): S {
  let current = state.teamPreferences[action.teamId];
  let update: StoreData<ApiT.Preferences> = current;

  // If data start -- mark as fetching if none
  if (action.dataType === "FETCH_START") {
    if (! ok(current)) {
      update = "FETCHING";
    }
  }

  // Else update with data if any, FETCH_ERROR if none
  else if (action.preferences) {
    update = action.preferences;
  }

  else if (! ready(current)) {
    update = "FETCH_ERROR";
  }

  return _.extend({}, state, {
    teamPreferences: {
      ...state.teamPreferences,
      [action.teamId]: update
    }
  });
}

export function updateReducer
  <S extends TeamPreferencesState & Partial<EventsState>>
(
  state: S, action: UpdateAction
): S {
  let { teamId, preferences: update } = action;
  let current = state.teamPreferences[teamId];
  if (ready(current)) {
    return _.extend({}, state, resetForCalgroupId(teamId, state), {
      teamPreferences: {
        ...state.teamPreferences,
        [teamId]: { ...current, ...update }
      }
    });
  }
  return state;
}

export function initState(): TeamPreferencesState {
  return {
    teamPreferences: {}
  };
}
