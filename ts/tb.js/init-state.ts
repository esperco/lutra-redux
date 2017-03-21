import { State } from "./types";
import * as Alerts from "../states/alerts";
import * as DataStatus from "../states/data-status";
import * as Events from "../states/events";
import * as TeamCalendars from "../states/team-cals";
import * as TeamPreferences from "../states/team-preferences";

/*
  Exports a correctly typed state object.
  We have separate state, state2 variables so it picks up on typing.
*/
export default function initState(): State {
  return {
    ...Alerts.initState(),
    ...DataStatus.initState(),
    ...Events.initState(),
    ...TeamCalendars.initState(),
    ...TeamPreferences.initState()
  };
}
