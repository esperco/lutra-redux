/*
  Sidebar for group events filtering -- delays
*/
import * as React from 'react';
import SearchInput from "../components/SearchInput";
import GroupLabelsSelector from "./GroupLabelsSelector";
import { QueryFilter, reduce } from "../lib/event-queries";
import { State as StoreState } from "./types";
import { ready } from "../states/data-status";
import * as EventText from "../text/events";
import * as LabelText from "../text/labels";

interface Props {
  className?: string;
  query: QueryFilter;
  groupId: string;
  state: StoreState;
  onChange: (query: QueryFilter) => void;
}

export class GroupFiltersSelector extends React.Component<Props, {}> {
  render() {
    let labels = this.props.state.groupLabels[this.props.groupId];
    return <div className={this.props.className}>
      <div className="panel">
        <SearchInput
          id="group-events-search"
          value={this.props.query.contains || ""}
          placeholder={EventText.FilterEvents}
          onChange={(val) => this.update({contains: val})}
        />
      </div>

      { ready(labels) ?
        <div className="panel">
          <h4>{ LabelText.Labels }</h4>
          <GroupLabelsSelector
            labels={labels}
            selected={this.props.query.labels}
            onChange={(x) => this.update({ labels: x })}
          />
        </div> : null }
    </div>;
  }

  update(x: Partial<QueryFilter>) {
    let query = reduce({ ...this.props.query, ...x });
    this.props.onChange(query);
  }
}

export default GroupFiltersSelector;