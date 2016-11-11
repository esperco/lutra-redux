import * as _ from "lodash";

export interface CounterState {
  counter: number;
}

export interface IncrAction {
  type: "INCR";
  value: number;
}

export function incrReducer<S extends CounterState>(
  state: S, action: IncrAction
) {
  state = _.clone(state);
  state.counter += action.value;
  return state;
} 

export function initCounter(): CounterState {
  return {
    counter: 0
  };
}