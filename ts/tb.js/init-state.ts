import { State } from "./types";
import * as DataStatus from "../states/data-status";
import * as Events from "../states/events";

/*
  Exports a correctly typed state object.
  We have separate state, state2 variables so it picks up on typing.
*/
export default function initState(): State {
  return {
    ...DataStatus.initState(),
    ...Events.initState()
  };
}
