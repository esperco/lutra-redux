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
  [groupId: string]: LabelSuggestionTable;
}

export interface GuestSuggestionTable {
  [nameOrEmail: string]: Guest;
}

export interface GuestSuggestionsState {
  [groupId: string]: GuestSuggestionTable;
}

export interface SuggestionsState {
  groupLabelSuggestions: LabelSuggestionsState;
  groupGuestSuggestions: GuestSuggestionsState;
}

export interface SuggestionsAction {
  type: "GROUP_SUGGESTIONS";
  groupId: string;
  labels?: LabelSuggestionTable;
  guests?: GuestSuggestionTable;
}

// Merge new suggestions with old one
export function suggestReducer<S extends SuggestionsState>(
  state: S, action: SuggestionsAction
): S {
  let { groupId, guests, labels } = action;
  let update: Partial<SuggestionsState> = {};

  if (labels) {
    update.groupLabelSuggestions = {
      ...state.groupLabelSuggestions,
      [groupId]: {
        ...state.groupLabelSuggestions[groupId],
        ...labels
      }
    };
  }

  if (guests) {
    update.groupGuestSuggestions = {
      ...state.groupGuestSuggestions,
      [groupId]: {
        ...state.groupGuestSuggestions[groupId],
        ...guests
      }
    };
  }

  return _.extend({}, state, update);
}

export function initState(): SuggestionsState {
  return {
    groupGuestSuggestions: {},
    groupLabelSuggestions: {}
  }
}

