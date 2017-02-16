import { State } from "./types";
import * as DataStatus from "../states/data-status";
import * as Groups from "../states/groups";

/*
  Exports a correctly typed state object.
  We have separate state, state2 variables so it picks up on typing.
*/
export default function initState(): State {
  return {
    ...DataStatus.initState(),
    ...Groups.initState()
  };
}
