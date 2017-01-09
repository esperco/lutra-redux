/*
  Helper to iterate through a bunch of events for a given query in
  EventsState. Calls callback for each event exactly once (even if
  encountered multiple times). Breaks and returns false if any result
  or event not found. Otherwise returns true.
*/

import * as ApiT from "./apiT";
import { GenericPeriod, toDays } from "../lib/period";
import { QueryFilter, stringify } from "./event-queries";
import { ready } from "../states/data-status";
import { EventsState } from "../states/group-events";

export function iter(
  props: {
    groupId: string;
    query: QueryFilter;
    period: GenericPeriod;
  },
  state: EventsState,
  cb: (event: ApiT.GenericCalendarEvent) => void
) {
  // Have we seen this event before?
  let eventMap: Record<string, true> = {};

  /*
    Iterate through each event for each day in query -- breaks and returns
    null if data isn't ready yet
  */
  let queryDays = state.groupEventQueries[props.groupId] || [];
  let { start, end } = toDays(props.period);
  let key = stringify(props.query);
  for (let i = start; i <= end; i++) {
    let queryResults = (queryDays[i] || {})[key];
    if (! ready(queryResults)) return false;

    for (let j in queryResults.eventIds) {
      let id = queryResults.eventIds[j];
      let event = (state.groupEvents[props.groupId] || {})[id];
      if (! ready(event)) return false;

      // Don't process same event twice
      if (! eventMap[event.id]) {
        eventMap[event.id] = true;

        // Skip hidden events
        if (event.hidden) { continue; }

        // Call process function
        cb(event);
      }
    }
  }

  return true;
}

export default iter;