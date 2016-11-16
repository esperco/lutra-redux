/*
  Error state -- used for showing an error message to the user
*/
import * as _ from "lodash";
import { ErrorDetails } from "../lib/errors";
import { AjaxError } from "../lib/json-http";

export interface ErrorMsgState {
  errors?: {
    code: number;
    details?: ErrorDetails;
  }[];
}

export interface AddErrorAction {
  type: "ADD_ERROR";
  code: number;
  details?: ErrorDetails;
}

// Remove error with a given tag
export interface RmErrorAction {
  type: "RM_ERROR";
  value: number|string; // Code or tag
}

export type ErrorAction = AddErrorAction|RmErrorAction;

export function errorReducer<S extends ErrorMsgState>(
  state: S, action: ErrorAction
) {
  // Clone, don't mutate
  state = _.clone(state);
  let errors = state.errors = state.errors || [];
  errors = _.clone(errors);

  // Add error to list
  if (action.type === "ADD_ERROR") {
    // If error exists already, replace. Else, append.
    let index = _.findIndex(errors || [], action.details ? 
      (e) => (e.details && action.details && 
              e.details.tag === action.details.tag) : 
      (e) => (!e.details && e.code === action.code));

    let value = action.details ?
      { details: action.details, code: action.code } :
      { code: action.code };
    if (index >= 0) {
      errors[index] = value;
    } else {
      errors.push(value);
    }
  }

  // Remove error
  else {
    errors = _.filter(errors, (e) => _.isString(action.value) ? 
      !e.details || e.details.tag !== action.value :
      !!e.details || e.code !== action.value
    );
  }  

  state.errors = errors;
  return state;
}

// Returns a function that can be hooked up to handle AJAX errors from API
export function errorHandler(
  dispatch: (a: ErrorAction) => any
) {
  return function(err: AjaxError) {
    dispatch({
      type: "ADD_ERROR",
      code: err.code,
      details: err.details
    });
  }
}
