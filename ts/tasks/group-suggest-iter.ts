/*
  Iterate over events in query and add to suggestions
*/
import * as _ from "lodash";
import { GenericPeriod } from "../lib/period";
import { normalizeGuest } from "../lib/event-guests";
import { QueryFilter } from "../lib/event-queries";
import iter from "../lib/event-query-iter";
import { compactObject } from "../lib/util";
import {
  LabelSuggestionTable, GuestSuggestionTable, SuggestionsAction
} from "../states/group-suggestions";
import { EventsState } from "../states/group-events";

export interface QuerySuggestTask {
  type: "GROUP_QUERY_SUGGESTIONS";
  groupId: string;
  query: QueryFilter;
  period: GenericPeriod;
};

// Handle task, return action maybe
export function handleGroupQuerySuggest(
  task: QuerySuggestTask,
  state: EventsState
): SuggestionsAction|void {
  let labels: LabelSuggestionTable = {};
  let guests: GuestSuggestionTable = {};

  iter(task, state, (event) => {
    // Get labels from each event
    _.each(event.labels || [], (l) => {
      labels[l.normalized] = labels[l.normalized] || l;
    });

    // Get guests
    _.each(event.guests || [], (g) => {
      let norm = normalizeGuest(g);
      let current = guests[norm] || {};
      guests[norm] = compactObject({
        email: current.email || g.email,
        displayName: current.displayName || g.display_name
      });
    });
  });

  return {
    type: "GROUP_SUGGESTIONS",
    groupId: task.groupId,
    labels, guests
  };
}
