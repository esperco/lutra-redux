import * as _ from "lodash";
import { State } from "./types";
import * as DataStatus from "../states/data-status";
import * as Events from "../states/group-events";
import * as Groups from "../states/groups";

/*
  Exports a correctly typed state object.
  We have separate state, state2 variables so it picks up on typing.
*/
export default function initState(): State {
  let state1 = DataStatus.initState();
  let state2 = _.extend(state1, Groups.initState());
  let state3 = _.extend(state2, Events.initState());
  return state3;
}
