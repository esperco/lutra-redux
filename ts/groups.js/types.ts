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
import { UpdateStoreTask } from "../tasks/update-store";

/*
  Actions are updates to the Redux store -- they are processed by both
  the main thread and the worker thread (if any)
*/
export type Action =
  DataStatus.DataAction|
  Events.EventsDataAction|
  Events.EventsUpdateAction|
  Groups.GroupDataAction|
  Groups.GroupUpdateAction|
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
  Groups.GroupState,
  ErrorMsg.ErrorMsgState,
  Login.LoginState,
  Routing.RouteState<Routes.RouteTypes> { };

// Variant of state where we're logged in
export type LoggedInState = State & Login.LoggedInState;

// Typed dispatch function (Redux store)
export interface DispatchFn {
  (a: Action): Action;
}

/*
  Tasks are messages that get passed to our worker function for processing.
*/
export type Task = UpdateStoreTask<Action>;

// Typed function for posting Tasks
export interface PostTaskFn {
  (t: Task): any;
}
