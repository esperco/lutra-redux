/*
  State for global saving / fetching spinner
*/
import * as _ from "lodash";

export interface DataState {
  apiCalls: {
    /*
      True if this call modifies data (save / push call). We only care about
      this because this enables to do stuff like warn users that data may be
      lost.
    */
    [index: string]: boolean;
  };
}

export interface DataStartAction {
  type: "DATA_START";
  id: string;
  modData?: boolean;
}

// Remove error with a given tag
export interface DataEndAction {
  type: "DATA_END";
  id: string;
}

export type DataAction = DataStartAction|DataEndAction;

export function dataReducer<S extends DataState>(
  state: S, action: DataAction
): S {
  state = _.clone(state);
  let apiCalls = state.apiCalls = _.clone(state.apiCalls);
  if (action.type === "DATA_START") {
    apiCalls[action.id] = action.modData || false;
  } else {
    delete apiCalls[action.id];
  }
  return state;
}

export function initState(): DataState {
  return { apiCalls: {} };
}


/* Returns functions to handle data start and end handlers from API */

export function dataStartHandler(dispatch: (a: DataStartAction) => any
) {
  return function(id: string, modData?: boolean) {
    dispatch({
      type: "DATA_START",
      id, modData
    });
  }
}

export function dataEndHandler(dispatch: (a: DataEndAction) => any
) {
  return function(id: string) {
    dispatch({ type: "DATA_END", id });
  }
}


// Types for use with other forms of store data

/*
  Store data can be in one of multiple states -- fetching / error states.
  Helper types to make sure we type-check all states store data could be in
  before we use it.

  NB: This type precludes usage with strings, or at least strings that
  match our status string literals
*/
export type StoreData<T> = T|"FETCHING"|"FETCH_ERROR";
export type StoreMap<T> = {
  [index: string]: StoreData<T>|undefined;
};

/*
  Helper for saying data is an acceptable state -- useful for 'should I
  fetch this data?
*/
export function ok<T>(data: StoreData<T>|undefined): data is T|"FETCHING" {
  return !_.isUndefined(data) && data !== "FETCH_ERROR";
}

/*
  Returns true if data is actually useable
*/
export function ready<T>(data: StoreData<T>|undefined): data is T {
  return ok(data) && data !== "FETCHING";
}