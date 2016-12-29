/*
  A widget for selecting a set of labels
*/

import * as _ from "lodash";
import * as React from "react";
import Icon from "../components/Icon";
import { Choice } from '../components/FilterMenu';
import { TagList } from "../components/TagList";
import {
  Guest, GuestSet, filter, match, newGuest, normalize
} from "../lib/event-guests";
import * as CommonText from "../text/common";
import { ChoiceSet } from "../lib/util";


/* Convert between choice and guest types */

function toChoice(g: Guest): Choice {
  return {
    original: g.displayName || g.email || "",
    normalized: normalize(g.email || g.displayName || "")
  };
}

function toGuest(c: Choice|string, guestSet: GuestSet): Guest {
  let g = newGuest(typeof c === "string" ? c : c.normalized);

  // Call .get with newGuest rather than key because we don't know whether
  // key refers to email or display name
  return guestSet.get(g) || g;
}


export class GroupGuestsSelector extends React.Component<{
  guests: GuestSet;
  selected: string[];
  onChange: (selected: string[]) => void;
  onSubmit?: () => void;
}, {}> {
  _tagList: TagList;

  render() {
    let allGuests = this.props.guests.clone();
    let choices = new ChoiceSet(allGuests.map(toChoice));

    let selected = new ChoiceSet<Choice>([]);
    _.each(this.props.selected || [], (v) => {
      let g = toGuest(v, allGuests);
      let c = toChoice(g);
      allGuests.push(g);
      selected.push(c);
      choices.push(c);
    });

    // Converts guest to a list of strings in URL
    let toggleGuest = (guest: Guest, val: boolean) => {
      let selectedGuests = new GuestSet(
        selected.map((c) => toGuest(c, allGuests))
      );
      val ? selectedGuests.push(guest) : selectedGuests.pull(guest);
      let newVals = selectedGuests.map((g) => g.email || g.displayName || "");
      this.props.onChange(newVals);
    };

    // Toggle an existing choice
    let onToggle = (choice: Choice, val: boolean) => {
      toggleGuest(toGuest(choice, allGuests), val);
    };

    // Adds a new guest
    let onAdd = (val: string) => {
      toggleGuest(newGuest(val), true);
    };

    // Select all guests SpecialChoice
    let selectAll = {
      displayAs: CommonText.SelectAll,
      selected: _.isEmpty(this.props.selected),
      onSelect: () => {
        this.props.onChange([]);
        this._tagList && this._tagList.close();
      }
    };

    // Button displays special filter status
    let buttonText = <Icon type="add" />;
    if (selectAll.selected) {
      buttonText = <span>
        <span>{selectAll.displayAs}</span>
        <Icon type="edit" />
      </span>;
    }

    return <TagList
      ref={(c) => this._tagList = c}
      choices={choices}
      selected={selected}
      filterFn={(c, filterStr) => filter(toGuest(c, allGuests), filterStr)}
      matchFn={(c, filterStr) => match(toGuest(c, allGuests), filterStr)}
      onAdd={onAdd}
      onToggle={onToggle}
      onClose={this.props.onSubmit}
      buttonText={buttonText}
      specialChoices={[ selectAll ]}
    />;
  }
}

export default GroupGuestsSelector;