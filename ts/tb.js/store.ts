// Redux store
import * as _ from "lodash";
import { createStore, compose } from "redux";
import * as Log from "../lib/log";

// Store Types
import { State, Action, DispatchFn } from "./types";
import * as Alerts from "../states/alerts";
import * as DataStatus from "../states/data-status";
import * as ErrorMsg from "../states/error-msg";
import * as Events from "../states/events";
import * as Login from "../lib/login";
import * as Routing from "../lib/routing";
import * as Scroll from "../states/scroll";
import * as TeamCalendars from "../states/team-cals";
import * as TeamPreferences from "../states/team-preferences";
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
      case "SCROLL":
        return Scroll.scrollReducer(state, action);
      case "EVENTS_DATA":
        return Events.eventsDataReducer(state, action);
      case "EVENTS_UPDATE":
        return Events.eventsUpdateReducer(state, action);
      case "TEAM_CALENDAR_DATA":
        return TeamCalendars.teamCalendarDataReducer(state, action);
      case "TEAM_CALENDAR_UPDATE":
        return TeamCalendars.teamCalendarUpdateReducer(state, action);
      case "TEAM_PREFERENCES_DATA":
        return TeamPreferences.dataReducer(state, action);
      case "TEAM_PREFERENCES_UPDATE":
        return TeamPreferences.updateReducer(state, action);
      case "DATA_START":
      case "DATA_END":
        return DataStatus.dataReducer(state, action);
      case "ADD_ERROR":
      case "RM_ERROR":
        return ErrorMsg.errorReducer(state, action);
      case "ADD_ALERT":
      case "REMOVE_ALERT":
        return Alerts.alertReducer(state, action);
      default:
        // Ignore actions that start with @@ (these are built-in Redux
        // actions) but log any other weird ones
        if (action && !(action.type && _.startsWith(action.type, "@@"))) {
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