/*
  Group-specific type groupings
*/

import * as DataStatus from "../states/data-status";
import * as Calcs from "../states/group-calcs";
import * as Events from "../states/group-events";
import * as Suggestions from "../states/group-suggestions";
import * as Groups from "../states/groups";
import * as TeamCalendars from "../states/team-cals";
import * as ErrorMsg from "../states/error-msg";
import * as Scroll from "../states/scroll";
import * as Select from "../states/events-select";
import * as Login from "../lib/login";
import * as Routing from "../lib/routing";
import * as Routes from "./routes";
import { UpdateStoreTask } from "../tasks/update-store";
import { QueryCalcTask } from "../tasks/group-query-calc";
import { QuerySuggestTask } from "../tasks/group-suggest-iter";

/*
  Actions are updates to the Redux store -- they are processed by both
  the main thread and the worker thread (if any)
*/
export type Action =
  Calcs.CalcStartAction|
  Calcs.CalcEndAction|
  DataStatus.DataAction|
  Events.EventsDataAction|
  Events.EventsUpdateAction|
  Events.EventCommentAction|
  Events.EventsInvalidatePeriodAction|
  Groups.GroupDataAction|
  Groups.GroupPreferencesAction|
  Groups.GroupUpdateAction|
  Groups.GroupAddGIMAction|
  Groups.GroupDeleteGIMAction|
  Suggestions.SuggestionsAction|
  TeamCalendars.TeamCalendarDataAction|
  TeamCalendars.TeamCalendarUpdateAction|
  Login.LoginAction|
  ErrorMsg.ErrorAction|
  Routing.RouteAction<Routes.RouteTypes>|
  Scroll.ScrollAction|
  Select.ToggleEventAction|
  { type: "@@INIT" };

/*
  Redux store state is a combination of many other substates
*/
export interface State extends
  Calcs.GroupCalcState,
  DataStatus.DataState,
  Events.EventsState,
  Groups.GroupState,
  ErrorMsg.ErrorMsgState,
  Scroll.ScrollState,
  Suggestions.SuggestionsState,
  TeamCalendars.TeamCalendarState,
  Login.LoginState,
  Routing.RouteState<Routes.RouteTypes>,
  Select.EventsSelectState { };

// Variant of state where we're logged in
export type LoggedInState = State & Login.LoggedInState;

// Typed dispatch function (Redux store)
export interface DispatchFn {
  (a: Action): Action;
}

/*
  Tasks are messages that get passed to our worker function for processing.
*/
export type Task = UpdateStoreTask<Action>|
  QueryCalcTask|
  QuerySuggestTask;

// Typed function for posting Tasks
export interface PostTaskFn {
  (t: Task): any;
}
