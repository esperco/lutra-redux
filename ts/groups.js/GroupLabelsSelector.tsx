/*
  A widget for selecting a set of labels
*/

import * as _ from "lodash";
import * as React from "react";
import Icon from "../components/Icon";
import { Choice } from '../components/FilterMenu';
import { TagList } from "../components/TagList";
import * as ApiT from "../lib/apiT";
import * as ASN from "../lib/asn";
import { LabelSet, newLabel, filter } from "../lib/event-labels";
import * as CommonText from "../text/common";
import * as LabelText from "../text/labels";
import { makeRecord } from "../lib/util";


export class GroupLabelsSelector extends React.Component<{
  labels: LabelSet;
  selected: ASN.AllSomeNone;
  onChange: (selected: ASN.AllSomeNone) => void;
  onSubmit?: () => void;
}, {}> {
  _tagList: TagList;

  render() {
    let choices = this.props.labels.clone();
    let selected = new LabelSet([]);
    let selectedSome = (this.props.selected || {}).some || {};
    _.each(selectedSome, (v, k) => {
      if (v && k) {
        let choice = newLabel(k);
        if (choices.has(choice)) {
          selected.push(choices.get(choice));
        } else {
          selected.push(choice);
          choices.push(choice);
        }
      }
    });

    // Sort (uses normalized form by default)
    choices.sort();
    selected.sort();

    /*
      Toggle a selected choice on and off -- note that we're not using
      ASN.update for this because we may not have all the labels in choices
    */
    let toggleLabel = (label: ApiT.LabelInfo, val: boolean) => {
      let newSelected = val ? selected.with(label) : selected.without(label);
      let some = makeRecord(newSelected.map((c) => c.original));

      if (_.isEmpty(some)) {
        this.props.onChange({ all: true, none: true });
      } else {
        this.props.onChange({ some });
      }
    }

    let onToggle = (choice: Choice, val: boolean) => {
      let label = choices.getByKey(choice.normalized);
      if (label) {
        toggleLabel(label, val);
      }
    };

    // Adds a new label
    let onAdd = (val: string) => {
      toggleLabel(newLabel(val), true);
    };

    // Select all labels SpecialChoice
    let selectAll = {
      displayAs: CommonText.SelectAll,
      selected: !this.props.selected ||
                !!(this.props.selected.all &&
                this.props.selected.none),
      onSelect: () => {
        this.props.onChange({ all: true, none: true });
        this._tagList && this._tagList.close();
      }
    };

    // Select unlabeled SpecialChoice
    let selectNone = {
      displayAs: LabelText.SelectUnlabeled,
      selected: !this.props.selected.all &&
                !!this.props.selected.none,
      onSelect: () => {
        this.props.onChange({ none: true });
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
    else if (selectNone.selected) {
      buttonText = <span>
        <span>{selectNone.displayAs}</span>
        <Icon type="edit" />
      </span>;
    }

    return <TagList
      ref={(c) => this._tagList = c}
      choices={choices}
      selected={selected}
      onAdd={onAdd}
      onToggle={onToggle}
      onClose={this.props.onSubmit}
      filterFn={(str) => filter(choices, str)}
      buttonText={buttonText}
      specialChoices={[
        selectAll,
        selectNone
      ]}
    />;
  }
}

export default GroupLabelsSelector;