/*
  Group-specific type groupings
*/

import * as DataStatus from "../states/data-status";
import * as ErrorMsg from "../states/error-msg";
import * as Calcs from "../states/group-calcs";
import * as Events from "../states/events";
import * as Suggestions from "../states/suggestions";
import * as Groups from "../states/groups";
import * as InviteEmails from "../states/invite-emails";
import * as TeamCalendars from "../states/team-cals";
import * as TeamPreferences from "../states/team-preferences";
import * as Scroll from "../states/scroll";
import * as Select from "../states/events-select";
import * as Login from "../lib/login";
import * as Routing from "../lib/routing";
import * as Routes from "./routes";
import { UpdateStoreTask } from "../tasks/update-store";
import { QueryCalcTask } from "../tasks/group-query-calc";
import { QuerySuggestTask } from "../tasks/suggest-iter";

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
  Events.EventsInvalidatePeriodAction|
  Groups.GroupDataAction|
  Groups.GroupPreferencesAction|
  Groups.GroupUpdateAction|
  Groups.GroupAddGIMAction|
  Groups.GroupAddTeamAction|
  Groups.GroupDeleteGIMAction|
  Groups.GroupDeleteTeamAction|
  InviteEmails.UpdateInviteStateAction|
  Suggestions.SuggestionsAction|
  TeamCalendars.TeamCalendarDataAction|
  TeamCalendars.TeamCalendarUpdateAction|
  TeamPreferences.DataAction|
  TeamPreferences.UpdateAction|
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
  InviteEmails.InviteState,
  Scroll.ScrollState,
  Suggestions.SuggestionsState,
  TeamCalendars.TeamCalendarState,
  TeamPreferences.TeamPreferencesState,
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
