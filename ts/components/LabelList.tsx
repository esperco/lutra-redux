import * as React from "react";
import Icon from "./Icon";
import TagList from "./TagList";
import * as ApiT from "../lib/apiT";
import {
  getLabelPartials, LabelSet, newLabel, filter
} from "../lib/event-labels";
import * as LabelText from "../text/labels";

export interface Props {
  labels: LabelSet;           // Default labels to show in dropdown
  searchLabels?: LabelSet;    // Set of labels to use for autocomplete
  labelHrefFn?: (label: ApiT.LabelInfo) => string;
  events: ApiT.GenericCalendarEvent[];
  onChange: (ids: string[], x: ApiT.LabelInfo, active: boolean) => void;
}

export class LabelList extends React.Component<Props, {}> {
  _tagList: TagList;

  render() {
    let {
      labels,
      selected,
      partial
    } = getLabelPartials(this.props.labels, this.props.events);
    let searchLabels = this.props.searchLabels || labels;

    return <TagList
      ref={(c) => this._tagList = c}
      choices={labels}
      selectedChoices={selected}
      partial={partial}
      filterFn={(filterStr) => filter(searchLabels, filterStr)}
      onAdd={this.add}
      onToggle={this.toggle}
      buttonText={<Icon type="add">
        { LabelText.AddLabel }
      </Icon>}
      tagHrefFn={this.props.labelHrefFn}
    />;
  }

  toggle = (label: ApiT.LabelInfo, val: boolean, method: "click"|"enter") => {
    this.props.onChange(
      this.props.events.map((e) => e.id),
      label, val
    );
    if (method === "click" && this._tagList) {
      this._tagList.close();
    }
  }

  add = (original: string, method: "click"|"enter") => {
    this.toggle(newLabel(original), true, method);
  }
}

export default LabelList;