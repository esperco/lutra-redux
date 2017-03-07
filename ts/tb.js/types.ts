/*
  Group-specific type groupings
*/

import * as DataStatus from "../states/data-status";
import * as ErrorMsg from "../states/error-msg";
import * as Events from "../states/events";
import * as Login from "../lib/login";
import * as Routing from "../lib/routing";
import * as Routes from "./routes";
import * as TeamCalendars from "../states/team-cals";
import * as TeamPreferences from "../states/team-preferences";

/*
  Actions are updates to the Redux store -- they are processed by both
  the main thread and the worker thread (if any)
*/
export type Action =
  DataStatus.DataAction|
  Events.EventsDataAction|
  Events.EventsUpdateAction|
  TeamCalendars.TeamCalendarDataAction|
  TeamCalendars.TeamCalendarUpdateAction|
  TeamPreferences.DataAction|
  TeamPreferences.UpdateAction|
  Login.LoginAction|
  ErrorMsg.ErrorAction|
  Routing.RouteAction<Routes.RouteTypes>|
  { type: "@@INIT" };

/*
  Redux store state is a combination of many other substates
*/
export interface State extends
  DataStatus.DataState,
  Events.EventsState,
  ErrorMsg.ErrorMsgState,
  TeamCalendars.TeamCalendarState,
  TeamPreferences.TeamPreferencesState,
  Login.LoginState,
  Routing.RouteState<Routes.RouteTypes> { };

// Variant of state where we're logged in
export type LoggedInState = State & Login.LoggedInState;

// Typed dispatch function (Redux store)
export interface DispatchFn {
  (a: Action): Action;
}
