/*
  Our Redux store and reducers (shared code between worker and renderer thread)
*/
import { createStore, compose } from "redux";
import * as Log from "../lib/log";

// Store Types
import { State, Action, DispatchFn } from "./types";
import * as DataStatus from "../states/data-status";
import * as ErrorMsg from "../states/error-msg";
import * as Select from "../states/events-select";
import * as Calcs from "../states/group-calcs";
import * as Events from "../states/events";
import * as Suggestions from "../states/suggestions";
import * as InviteEmails from "../states/invite-emails";
import * as Groups from "../states/groups";
import * as Scroll from "../states/scroll";
import * as TeamCalendars from "../states/team-cals";
import * as TeamPreferences from "../states/team-preferences";
import * as Login from "../lib/login";
import * as Routing from "../lib/routing";
import initState from "./init-state";

// Check for redux dev tools extension
declare var devToolsExtension: any;

/* Redux Store Initialization */
export const store = createStore(
  // Reducers
  function(state: State, action: Action) {
    switch (action.type) {
      case "LOGIN":
        return Login.loginReducer(state, action);
      case "FEATURE_FLAG":
        return Login.featureFlagsReducer(state, action);
      case "ROUTE":
        return Routing.routeReducer(state, action);
      case "GROUP_DATA":
        return Groups.groupDataReducer(state, action);
      case "GROUP_UPDATE":
        return Groups.groupUpdateReducer(state, action);
      case "GROUP_ADD_GIM":
        return Groups.groupAddGIMReducer(state, action);
      case "GROUP_DELETE_GIM":
        return Groups.groupDeleteGIMReducer(state, action);
      case "GROUP_ADD_TEAM":
        return Groups.groupAddTeamReducer(state, action);
      case "GROUP_DELETE_TEAM":
        return Groups.groupDeleteTeamReducer(state, action);
      case "GROUP_PREFS":
        return Groups.groupPreferencesReducer(state, action);
      case "EVENTS_DATA":
        return Events.eventsDataReducer(state, action);
      case "EVENTS_UPDATE":
        return Events.eventsUpdateReducer(state, action);
      case "EVENTS_INVALIDATE_PERIOD":
        return Events.invalidatePeriodReducer(state, action);
      case "GROUP_CALC_START":
      case "GROUP_CALC_END":
        return Calcs.calcReducer(state, action);
      case "SUGGESTIONS":
        return Suggestions.suggestReducer(state, action);
      case "TEAM_CALENDAR_DATA":
        return TeamCalendars.teamCalendarDataReducer(state, action);
      case "TEAM_CALENDAR_UPDATE":
        return TeamCalendars.teamCalendarUpdateReducer(state, action);
      case "TEAM_PREFERENCES_DATA":
        return TeamPreferences.dataReducer(state, action);
      case "TEAM_PREFERENCES_UPDATE":
        return TeamPreferences.updateReducer(state, action);
      case "TOGGLE_EVENT_SELECTION":
        return Select.reduceEventToggling(state, action);
      case "UPDATE_INVITE_EMAILS":
        return InviteEmails.updateInviteStateReducer(state, action);
      case "DATA_START":
      case "DATA_END":
        return DataStatus.dataReducer(state, action);
      case "ADD_ERROR":
      case "RM_ERROR":
        return ErrorMsg.errorReducer(state, action);
      case "SCROLL":
        return Scroll.scrollReducer(state, action);
      default:
        // Ignore actions that start with @@ (these are built-in Redux
        // actions) but log any other weird ones
        if (action && !(action.type && action.type.startsWith("@@"))) {
          Log.e("Unknown action type", action);
        }
    }
    return state;
  },

  // Initial state
  initState(),

  // Hook up to extension (if applicable)
  compose(typeof devToolsExtension === "undefined" ?
    (f: any) => f : devToolsExtension()));


/* Hook up main view to store */

// Bound dispatch and getState functions
export const dispatch: DispatchFn = store.dispatch.bind(store);
export const getState: typeof store.getState = store.getState.bind(store);
