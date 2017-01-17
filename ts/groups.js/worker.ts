/*
  Entry point for Groups worker function
*/

/// <reference path="../../config/config.d.ts" />
import * as _ from 'lodash';
import * as Conf from "config";
import * as Log from "../lib/log";
import { dispatch, getState } from "./store";
import { Action, Task } from "./types";
import { handleGroupQueryCalc } from "../tasks/group-query-calc";
import { handleGroupQuerySuggest } from "../tasks/group-suggest-iter";

/*
  Helper initialization
*/
Log.init(_.extend({
  logTrace: Conf.production
}, Conf));

/*
  Listen for tasks. Post actions back to renderer thread if applicable.
*/
addEventListener("message", (ev) => {
  let action = handleTask(ev.data);
  if (action) {
    /*
      Type-tweaking because our tsconfig assumes a window context and
      postMessage has a different signature in the webworker context.
    */
    (postMessage as any)(action);
  }
});

// Process tasks, return an optional action to be posted back to store
function handleTask(task: Task): Action|void {
  if (! task) return;
  switch (task.type) {
    case "UPDATE_STORE":
      dispatch(task.dispatch);
      break;
    case "GROUP_QUERY_CALC":
      return handleGroupQueryCalc(task, getState());
    case "GROUP_QUERY_SUGGESTIONS":
      return handleGroupQuerySuggest(task, getState());
    default:
      Log.e("Unknown task type", task);
  }
}

Log.d("Groups worker started");
