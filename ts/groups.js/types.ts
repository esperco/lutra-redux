/*
  Group-specific type groupings
*/

import * as DataStatus from "../states/data-status";
import * as Events from "../states/group-events";
import * as Groups from "../states/groups";
import * as ErrorMsg from "../states/error-msg";
import * as Login from "../lib/login";
import * as Routing from "../lib/routing";
import * as Routes from "./routes";

export type Action =
  DataStatus.DataAction|
  Events.EventsDataAction|
  Groups.GroupDataAction|
  Groups.GroupUpdateAction|
  Login.LoginAction|
  ErrorMsg.ErrorAction|
  Routing.RouteAction<Routes.RouteTypes>|
  { type: "@@INIT" };

export interface State extends
  DataStatus.DataState,
  Events.EventsState,
  Groups.GroupState,
  ErrorMsg.ErrorMsgState,
  Login.LoginState,
  Routing.RouteState<Routes.RouteTypes> { };

export type LoggedInState = State & Login.LoggedInState;

// Typed dispatch function (Redux store)
export interface DispatchFn {
  (a: Action): Action;
}
