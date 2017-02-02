import { State } from "./types";
import * as DataStatus from "../states/data-status";
import * as Calcs from "../states/group-calcs";
import * as Events from "../states/group-events";
import * as Groups from "../states/groups";
import * as TeamCalendars from "../states/team-cals";
import * as Suggestions from "../states/group-suggestions";
import * as Select from "../states/events-select";

/*
  Exports a correctly typed state object.
  We have separate state, state2 variables so it picks up on typing.
*/
export default function initState(): State {
  return {
    ...DataStatus.initState(),
    ...Groups.initState(),
    ...Events.initState(),
    ...Calcs.initState(),
    ...Select.initState(),
    ...Suggestions.initState(),
    ...TeamCalendars.initState()
  };
}
