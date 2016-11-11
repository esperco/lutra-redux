import * as _ from "lodash";
import { State } from "./types";
import * as Counter from "../states/counter";
import * as Name from "../states/name";

/*
  Exports a correctly typed state object.
  We have separate state, state2 variables so it picks up on typing.
*/
export default function initState(): State {
  let state = Counter.initCounter();
  let state2 = _.extend(state, Name.initName());
  return state2;
}
