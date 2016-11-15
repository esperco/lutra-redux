/*
  Group-specific type groupings
*/

import * as Counter from "../states/counter";
import * as Name from "../states/name";
import * as Routing from "../lib/routing";
import * as Routes from "./routes";

export type Action = 
  Counter.IncrAction|
  Name.NameChangeAction|
  Routing.RouteAction<Routes.RouteTypes>;

export interface State extends 
  Counter.CounterState,
  Name.NameState,
  Routing.RouteState<Routes.RouteTypes> { };

// Typed dispatch function (Redux store)
export interface DispatchFn {
  (a: Action): Action;
}
