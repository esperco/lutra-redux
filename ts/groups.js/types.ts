/*
  Group-specific type groupings
*/

import * as Counter from "../states/counter";
import * as Name from "../states/name";

export type Action = 
  Counter.IncrAction|
  Name.NameChangeAction;

export interface State extends 
  Counter.CounterState,
  Name.NameState { };

// Typed dispatch function (Redux store)
export interface DispatchFn {
  (a: Action): Action;
}