/*
  Sidebar for group events filtering -- delays
*/
import * as React from 'react';
import Icon from "../components/Icon";
import SearchInput from "../components/SearchInput";
import GroupGuestsSelector from "./GroupGuestsSelector";
import GroupLabelsSelector from "./GroupLabelsSelector";
import MinCostSelector from "./MinCostSelector";
import { GuestSet } from "../lib/event-guests";
import { LabelSet } from "../lib/event-labels";
import { QueryFilter, expand } from "../lib/event-queries";
import * as EventText from "../text/events";
import * as LabelText from "../text/labels";

interface Props {
  className?: string;
  query: QueryFilter;
  groupId: string;
  searchGuests: GuestSet;
  searchLabels: LabelSet;
  onChange: (query: QueryFilter) => void;
  onSubmit?: () => void;
}

export class GroupFiltersSelector extends React.Component<Props, {}> {
  render() {
    let expanded = expand(this.props.query);
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
        <h4><Icon type="labels">
          { LabelText.Labels }
        </Icon></h4>
        <GroupLabelsSelector
          labels={this.props.searchLabels}
          selected={expanded.labels}
          onChange={(labels) => this.update({ labels })}
          onSubmit={this.props.onSubmit}
        />
      </div>

      <div className="panel">
        <h4><Icon type="people">
          { EventText.Attendees }
        </Icon></h4>
        <GroupGuestsSelector
          guests={this.props.searchGuests}
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