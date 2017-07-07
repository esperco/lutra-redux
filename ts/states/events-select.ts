/*
  Track which current events have been selected by user
*/
import { forEach } from 'lodash';
import { useRecurringLabels } from "../lib/event-labels";
import { ready } from "./data-status";
import { EventsState } from "./events";

export interface EventsSelectState {
  // Event ID to true
  selectedEvents: Record<string, true>;
}

// Clear -> clear all prior events before toggling
export type ToggleEventAction = {
  type: "TOGGLE_EVENT_SELECTION";
  calgroupId: string;
  clear?: true;
  eventIds: Record<string, boolean>;
}

export function reduceEventToggling<S extends EventsSelectState & EventsState> (
  state: S, action: ToggleEventAction
): S {
  let selectedEvents = action.clear ? {} : Object.assign({}, state.selectedEvents);
  forEach(action.eventIds, (value, eventId) => {
    if (! eventId) return;
    if (value) {
      selectedEvents[eventId] = true;
    } else {
      delete selectedEvents[eventId];

      // Delete all recurrences as well
      let eventMap = state.events[action.calgroupId] || {};
      let event = eventMap[eventId];
      if (ready(event) && useRecurringLabels(event)) {
        for (let id in selectedEvents) {
          let selectedEvent = eventMap[id];
          if (ready(selectedEvent) &&
              useRecurringLabels(selectedEvent) &&
              selectedEvent.recurring_event_id === event.recurring_event_id) {
            delete selectedEvents[selectedEvent.id];
          }
        }
      }
    }
  });
  return Object.assign({}, state, { selectedEvents });
}

export function initState() {
  return {
    selectedEvents: {}
  };
}