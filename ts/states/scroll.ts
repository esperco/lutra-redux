import { extend } from 'lodash';

export interface ScrollState {
  lastScroll?: "up"|"down";
}

export interface ScrollAction {
  type: "SCROLL";
  direction: "up"|"down";
}

export function scrollReducer<S extends ScrollState>(
  state: S, action: ScrollAction
): S {
  if (state.lastScroll !== action.direction) {
    return extend({}, state, { lastScroll: action.direction });
  }
  return state;
}