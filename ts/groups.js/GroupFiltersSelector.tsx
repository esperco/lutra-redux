/*
  Sidebar for group events filtering -- delays
*/
import * as React from 'react';
import SearchInput from "../components/SearchInput";
import GroupGuestsSelector from "./GroupGuestsSelector";
import GroupLabelsSelector from "./GroupLabelsSelector";
import MinCostSelector from "./MinCostSelector";
import { guestSetFromGroupMembers, GuestSet } from "../lib/event-guests"
import { QueryFilter, expand } from "../lib/event-queries";
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
  onSubmit?: () => void;
}

export class GroupFiltersSelector extends React.Component<Props, {}> {
  render() {
    let groupLabels = this.props.state.groupLabels[this.props.groupId];
    let labels = ready(groupLabels) ? groupLabels.group_labels : [];
    let expanded = expand(this.props.query);

    let groupMembers = this.props.state.groupMembers[this.props.groupId];
    let guests = ready(groupMembers) ?
      guestSetFromGroupMembers(groupMembers) : new GuestSet([]);

    return <div className={this.props.className}>
      <div className="panel">
        <SearchInput
          id="group-events-search"
          value={expanded.contains || ""}
          placeholder={EventText.FilterEvents}
          onChange={(contains) => this.update({ contains })}
          onSubmit={this.props.onSubmit}
        />
      </div>

      <div className="panel">
        <MinCostSelector
          value={expanded.minCost}
          onChange={(minCost) => this.update({ minCost })}
        />
      </div>

      <div className="panel">
        <h4>{ LabelText.Labels }</h4>
        <GroupLabelsSelector
          labels={labels}
          selected={expanded.labels}
          onChange={(labels) => this.update({ labels })}
          onSubmit={this.props.onSubmit}
        />
      </div>

      <div className="panel">
        <h4>{ EventText.Attendees }</h4>
        <GroupGuestsSelector
          guests={guests}
          selected={expanded.participant}
          onChange={(participant) => this.update({ participant })}
          onSubmit={this.props.onSubmit}
        />
      </div>
    </div>;
  }

  update(x: Partial<QueryFilter>) {
    let query = { ...this.props.query, ...x };
    this.props.onChange(query);
  }
}

export default GroupFiltersSelector;