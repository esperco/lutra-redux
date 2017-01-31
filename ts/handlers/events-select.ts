/*
  Manage event selection
*/
// import * as _ from "lodash";
import { ToggleEventAction, EventsSelectState } from "../states/events-select";

/*
  Toggle an event.
*/
export function toggleEventId(props: {
  groupId: string;
  eventId: string;
  value: boolean;
}, deps: {
  dispatch: (a: ToggleEventAction) => void;
  state: EventsSelectState
}) {
  deps.dispatch({
    type: "TOGGLE_EVENT_SELECTION",
    ...props
  });
}