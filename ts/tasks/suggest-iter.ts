/*
  Iterate over events in query and add to suggestions
*/
import { GenericPeriod } from "../lib/period";
import { normalizeGuest } from "../lib/event-guests";
import { QueryFilter } from "../lib/event-queries";
import iter from "../lib/event-query-iter";
import { compactObject } from "../lib/util";
import {
  LabelSuggestionTable, GuestSuggestionTable, SuggestionsAction
} from "../states/suggestions";
import { EventsState } from "../states/events";

export interface QuerySuggestTask {
  type: "QUERY_SUGGESTIONS";
  calgroupId: string;
  query: QueryFilter;
  period: GenericPeriod;
};

// Handle task, return action maybe
export function handleQuerySuggest(
  task: QuerySuggestTask,
  state: EventsState
): SuggestionsAction|void {
  let labels: LabelSuggestionTable = {};
  let guests: GuestSuggestionTable = {};

  iter(task, state, (event) => {
    // Get labels from each event
    (event.labels || []).forEach((l) => {
      labels[l.normalized] = labels[l.normalized] || l;
    });

    // Get guests
    (event.guests || []).forEach((g) => {
      let norm = normalizeGuest(g);
      let current = guests[norm] || {};
      guests[norm] = compactObject({
        email: current.email || g.email,
        displayName: current.displayName || g.display_name
      });
    });
  });

  return {
    type: "SUGGESTIONS",
    calgroupId: task.calgroupId,
    labels, guests
  };
}
