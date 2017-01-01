import * as _ from "lodash";
import * as React from "react";
import Icon from "./Icon";
import TagList from "./TagList";
import * as ApiT from "../lib/apiT";
import {
  getLabelPartials, newLabel, match, filter
} from "../lib/event-labels";
import * as LabelText from "../text/labels";

interface Props {
  labels: ApiT.LabelInfo[];
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

    return <TagList
      ref={(c) => this._tagList = c}
      choices={labels}
      selected={selected}
      partial={partial}
      matchFn={match}
      filterFn={filter}
      onAdd={this.add}
      onToggle={this.toggle}
      buttonText={<Icon type="add">
        { LabelText.AddLabel }
      </Icon>}
    />;
  }

  toggle = (label: ApiT.LabelInfo, val: boolean, method: "click"|"enter") => {
    this.props.onChange(
      _.map(this.props.events, (e) => e.id),
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