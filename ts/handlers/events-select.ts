/*
  Manage event selection
*/
import { QueryFilter } from "../lib/event-queries";
import { iter } from "../lib/event-query-iter";
import { GenericPeriod } from "../lib/period";
import { ToggleEventAction, EventsSelectState } from "../states/events-select";
import { EventsState } from "../states/events";

/*
  Toggle a single event.
*/
export function toggleEventId(props: {
  calgroupId: string;
  eventId: string;
  value: boolean;
  clear?: boolean;
}, deps: {
  dispatch: (a: ToggleEventAction) => void;
  state: EventsSelectState
}) {
  let action: ToggleEventAction = {
    type: "TOGGLE_EVENT_SELECTION",
    calgroupId: props.calgroupId,
    eventIds: { [props.eventId]: props.value }
  };
  if (props.clear) action.clear = true;
  deps.dispatch(action);
}

// Clear selection
export function clearAll(calgroupId: string, deps: {
  dispatch: (a: ToggleEventAction) => void;
}) {
  deps.dispatch({
    type: "TOGGLE_EVENT_SELECTION",
    calgroupId,
    clear: true,
    eventIds: {}
  });
}

// Selects all events in a query
export function selectAll(props: {
  calgroupId: string;
  query: QueryFilter;
  period: GenericPeriod;
}, deps: {
  dispatch: (a: ToggleEventAction) => void;
  state: EventsSelectState & EventsState
}) {
  // Start collecting event Ids
  let eventIds: Record<string, true> = {};
  iter(props, deps.state, (event) => {
    eventIds[event.id] = true;
  });

  // Dispatch selection changes
  deps.dispatch({
    type: "TOGGLE_EVENT_SELECTION",
    calgroupId: props.calgroupId,
    clear: true,
    eventIds
  });
}

