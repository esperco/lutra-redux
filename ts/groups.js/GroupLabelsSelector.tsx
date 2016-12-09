/*
  A widget for selecting a set of labels
*/

import * as _ from "lodash";
import * as React from "react";
import DelayedASNSelector from "../components/DelayedASNSelector";
import { GroupLabels } from "../states/groups";
import * as ASN from "../lib/asn";
import * as CommonText from "../text/common";
import * as LabelText from "../text/labels";

export class GroupLabelsSelector extends React.Component<{
  labels: GroupLabels;
  selected: ASN.AllSomeNone;
  onChange: (selected: ASN.AllSomeNone) => void;
  delay?: number;
}, {}> {
  render() {
    let choices = _.map(this.props.labels.group_labels, (l) => ({
      id: l.normalized,
      displayAs: l.original,
      color: l.color
    }));
    return <DelayedASNSelector
      delay={this.props.delay}
      selected={this.props.selected}
      allText={CommonText.SelectAll}
      choices={choices}
      noneText={LabelText.Unlabeled}
      onChange={this.props.onChange}
    />;
  }
}

export default GroupLabelsSelector;