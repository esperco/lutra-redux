/*
  Group-specific type groupings
*/

import * as Counter from "../states/counter";
import * as Name from "../states/name";
import * as Login from "../lib/login";
import * as Routing from "../lib/routing";
import * as Routes from "./routes";

export type Action = 
  Counter.IncrAction|
  Name.NameChangeAction|
  Login.LoginAction|
  Routing.RouteAction<Routes.RouteTypes>|
  { type: "@@INIT" };

export interface State extends 
  Counter.CounterState,
  Name.NameState,
  Login.LoginState,
  Routing.RouteState<Routes.RouteTypes> { };

// Typed dispatch function (Redux store)
export interface DispatchFn {
  (a: Action): Action;
}
