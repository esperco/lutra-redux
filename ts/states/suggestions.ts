/*
  Store labels + guests we've run across while querying event data.
  Use to populate selectors and autocompletes.
*/
import * as _ from "lodash";
import * as ApiT from "../lib/apiT";
import { Guest } from "../lib/event-guests";

export interface LabelSuggestionTable {
  [normalized: string]: ApiT.LabelInfo;
}

export interface LabelSuggestionsState {
  [calgroupId: string]: LabelSuggestionTable;
}

export interface GuestSuggestionTable {
  [nameOrEmail: string]: Guest;
}

export interface GuestSuggestionsState {
  [calgroupId: string]: GuestSuggestionTable;
}

export interface SuggestionsState {
  labelSuggestions: LabelSuggestionsState;
  guestSuggestions: GuestSuggestionsState;
}

export interface SuggestionsAction {
  type: "SUGGESTIONS";
  calgroupId: string;
  labels?: LabelSuggestionTable;
  guests?: GuestSuggestionTable;
}

// Merge new suggestions with old one
export function suggestReducer<S extends SuggestionsState>(
  state: S, action: SuggestionsAction
): S {
  let { calgroupId, guests, labels } = action;
  let update: Partial<SuggestionsState> = {};

  if (labels) {
    update.labelSuggestions = {
      ...state.labelSuggestions,
      [calgroupId]: {
        ...state.labelSuggestions[calgroupId],
        ...labels
      }
    };
  }

  if (guests) {
    update.guestSuggestions = {
      ...state.guestSuggestions,
      [calgroupId]: {
        ...state.guestSuggestions[calgroupId],
        ...guests
      }
    };
  }

  return _.extend({}, state, update);
}

export function initState(): SuggestionsState {
  return {
    guestSuggestions: {},
    labelSuggestions: {}
  }
}

