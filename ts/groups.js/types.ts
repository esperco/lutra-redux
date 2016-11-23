/*
  Group-specific type groupings
*/

import * as Counter from "../states/counter";
import * as DataStatus from "../states/data-status";
import * as Name from "../states/name";
import * as ErrorMsg from "../states/error-msg";
import * as Login from "../lib/login";
import * as Routing from "../lib/routing";
import * as Routes from "./routes";

export type Action =
  Counter.IncrAction|
  DataStatus.DataAction|
  Name.NameChangeAction|
  Login.LoginAction|
  ErrorMsg.ErrorAction|
  Routing.RouteAction<Routes.RouteTypes>|
  { type: "@@INIT" };

export interface State extends
  Counter.CounterState,
  DataStatus.DataState,
  Name.NameState,
  ErrorMsg.ErrorMsgState,
  Login.LoginState,
  Routing.RouteState<Routes.RouteTypes> { };

// Typed dispatch function (Redux store)
export interface DispatchFn {
  (a: Action): Action;
}
