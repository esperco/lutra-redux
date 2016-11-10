import * as _ from "lodash";

export interface NameState {
  name: string;
}

export interface NameChangeAction {
  type: "NAME_CHANGE";
  value: string;
}

export function nameChangeReducer<S extends NameState>(
  state: S, action: NameChangeAction
) {
  state = _.clone(state);
  state.name = action.value;
  return state;
} 

export function initName(): NameState {
  return { name: "Name" };
}