/*
  This is the main view for the group page
*/

import * as React from 'react';
import * as classNames from 'classnames';
import { eventList } from "./paths";
import { State, DispatchFn } from './types';
import SearchInput from "../components/SearchInput";
import Icon from "../components/Icon";
import PeriodSelector from "../components/PeriodSelector";
import EventEditor from "../components/EventEditor";
import GroupEventsList from "./GroupEventsList";
import GroupLabelsSelector from "./GroupLabelsSelector";
import * as Events from "../handlers/group-events";
import { ApiSvc } from "../lib/api";
import { QueryFilter, reduce } from "../lib/event-queries";
import { GenericPeriod } from "../lib/period";
import { NavSvc } from "../lib/routing";
import { ready } from "../states/data-status";
import * as EventText from "../text/events";
import * as LabelText from "../text/labels";

class RouteProps {
  groupId: string;
  showFilters?: boolean;
  eventId?: string;
  query: QueryFilter;
  period: GenericPeriod;
}

class Props extends RouteProps {
  state: State;
  dispatch: DispatchFn;
  Svcs: ApiSvc & NavSvc;
}

class GroupEvents extends React.Component<Props, {}> {
  render() {
    let labels = this.props.state.groupLabels[this.props.groupId];

    return <div className={classNames("sidebar-layout", {
      "shift-left": this.props.showFilters && !this.props.eventId,
      "shift-right": !!this.props.eventId
    })}>
      {/* Filters Sidebar */}
      <div className="sidebar panel">
        <div className="panel">
          <SearchInput
            id="group-events-search"
            value={this.props.query.contains || ""}
            placeholder={EventText.FilterEvents}
            onUpdate={(val) => this.update({contains: val})}
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
      </div>

      {/* Main Content Area */}
      <div className="content">
        <div className="rowbar-layout">
          <header>
            {/* Toggle filters sidebar */}
            <button onClick={() => this.toggleFilters()}>
              <Icon type={this.props.showFilters ? "close" : "filters"} />
            </button>

            <PeriodSelector
              value={this.props.period}
              onChange={(p) => this.update({ period: p })}
            />

            { /* Close event */
              !!this.props.eventId ?
              <button onClick={() => this.update({
                eventId: undefined
              })}>
                <Icon type="close" />
              </button> : null
            }
          </header>

          <div className="content">
            <div className="container">
              { this.renderEventDates() }
            </div>
          </div>
        </div>
        <a className="backdrop" href={this.backdropHref()} />
      </div>

      {/* Additional event info goes here (if applicable) */}
      <div className="sidebar panel">
        { this.renderSingleEvent() }
      </div>
    </div>;
  }

  renderEventDates() {
    return <GroupEventsList
      {...this.props}
      eventHrefFn={(ev) => this.updateHref({
        eventId: ev.id,
        showFilters: false
      })}
    />;
  }

  renderSingleEvent() {
    if (this.props.eventId) {
      let eventMap = this.props.state.groupEvents[this.props.groupId] || {};
      let group = this.props.state.groupLabels[this.props.groupId];
      let labels = ready(group) ? group.group_labels : [];
      return <EventEditor
        event={eventMap[this.props.eventId]}
        labels={labels}
        onChange={(label, active) => Events.setGroupEventLabels({
          groupId: this.props.groupId,
          eventIds: this.props.eventId ? [this.props.eventId] : [],
          label, active
        }, this.props)}
      />
    }
    return null; // No event
  }

  // Toggling filters is just a hashchange
  toggleFilters() {
    this.props.Svcs.Nav.go(this.updateHref({
      showFilters: !this.props.showFilters,
      eventId: undefined
    }));
  }

  backdropHref() {
    return this.updateHref({
      showFilters: false,
      eventId: undefined
    });
  }

  // Path with new props
  updateHref(updates: Partial<RouteProps>|Partial<QueryFilter>) {
    let { groupId, showFilters, eventId, period } = this.props;
    let query = reduce(this.props.query);
    return eventList.href({
      groupId, showFilters, eventId, period,
      ...query, ...updates
    });
  }

  update(updates: Partial<RouteProps>|Partial<QueryFilter>) {
    this.props.Svcs.Nav.go(this.updateHref(updates));
  }
}

export default GroupEvents;
