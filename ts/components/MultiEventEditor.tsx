import * as _ from "lodash";
import * as React from "react";
import * as ApiT from "../lib/apiT";
import { LabelSet, useRecurringLabels } from "../lib/event-labels";
import * as CommonText from "../text/common";
import * as EventText from "../text/events";
import * as LabelText from "../text/labels";
import Dropdown from "./Dropdown";
import Icon from "./Icon";
import LabelList from "./LabelList";

interface Props {
  events: ApiT.GenericCalendarEvent[];
  labels: LabelSet;         // For LabelList
  searchLabels: LabelSet;   // For LabelList
  onChange: (eventIds: string[], x: ApiT.LabelInfo, active: boolean) => void;
  onHide: (eventIds: string[], hidden: boolean) => void;
  labelHrefFn?: (x: ApiT.LabelInfo) => string;
}

export class MultiEventEditor extends React.Component<Props, {}> {
  render() {
    if (_.isEmpty(this.props.events)) {
      return <div className="event-editor">
        <h3>{ EventText.NotFound }</h3>
      </div>;
    }

    let eventIds = _.map(this.props.events, (e) => e.id);
    let hasHiddenEvents = !!_.find(this.props.events, (e) => e.hidden);
    let hasRecurringEvents = !!_.find(this.props.events,
      (e) => useRecurringLabels(e)
    );

    return <div className="event-editor">
      <Dropdown
        toggle={<button className="dropdown-toggle">
          <Icon type="options" />
        </button>}

        menu={<div className="dropdown-menu"><div className="menu">
          <button className="hide-btn"
                  onClick={() => this.props.onHide(eventIds, !hasHiddenEvents)}>
            <span>{ hasHiddenEvents ? CommonText.Show : CommonText.Hide }</span>
            <div className="description">
              { hasHiddenEvents ?
                EventText.ShowMultiDescription :
                EventText.HideMultiDescription }
            </div>
          </button>
        </div></div>}
      />

      <h3>{ EventText.eventsSelected(this.props.events.length) }</h3>

      <LabelList
        labels={this.props.labels}
        searchLabels={this.props.searchLabels}
        events={this.props.events}
        onChange={this.props.onChange}
        labelHrefFn={this.props.labelHrefFn}
      />

      { hasRecurringEvents ?
        <div className="recurring-labels alert info">
          { LabelText.MultiRecurringLabelsDescription }
        </div> : null }
    </div>
  }
}

export default MultiEventEditor;
