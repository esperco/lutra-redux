/*
  This is the main view for the group page
*/

import * as React from 'react';
import * as classNames from 'classnames';
import { State, DispatchFn } from './types';
import Icon from "../components/Icon";
import PeriodSelector from "../components/PeriodSelector";
import { eventList } from "./paths";
import { ready } from "../states/data-status";
import { ApiSvc } from "../lib/api";
import { NavSvc } from "../lib/routing";
import GroupEventsList from "./GroupEventsList";
import GroupLabelsSelector from "./GroupLabelsSelector";
import * as LabelText from "../text/labels";
import * as ASN from "../lib/asn";
import { GenericPeriod } from "../lib/period";

class RouteProps {
  groupId: string;
  showFilters?: boolean;
  eventId?: string;
  labels: ASN.AllSomeNone;
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
    let Nav = this.props.Svcs.Nav;

    return <div className={classNames("sidebar-layout", {
      "shift-left": this.props.showFilters && !this.props.eventId,
      "shift-right": !!this.props.eventId
    })}>
      {/* Filters Sidebar */}
      <div className="sidebar panel">
        { ready(labels) ?
          <div className="panel">
            <h4>{ LabelText.Labels }</h4>
            <GroupLabelsSelector
              labels={labels}
              selected={this.props.labels}
              onChange={(x) => { Nav.go(eventList.href({
                ...this.props, labels: x
              }))} }
            />
          </div> : null }
      </div>

      {/* Main Content Area */}
      <div className="content">
        <div className="rowbar-layout">
          <header>
            <button onClick={() => Nav.go(this.toggleFiltersHref())}>
              <Icon type={this.props.showFilters ? "close" : "filters"} />
            </button>
            <PeriodSelector
              value={this.props.period}
              onChange={(p) => Nav.go(this.updateHref({ period: p }))}
            />
          </header>

          <div className="content">
            <div className="container">
              { this.renderEventDates() }
            </div>
          </div>
        </div>
        <a className="backdrop" href={this.toggleFiltersHref()} />
      </div>

      {/* Additional event info goes here (if applicable) */}
      <div className="sidebar panel" />
    </div>;
  }

  renderEventDates() {
    let { groupId, state, period, labels } = this.props;
    let queryState = state.groupEventQueries[groupId] || [];
    let eventMap = state.groupEvents[groupId] || {};
    let query = { labels };
    let props = { period, query, queryState, eventMap };
    return <GroupEventsList {...props} />;
  }

  // Toggling filters is just a hashchange
  toggleFiltersHref() {
    return this.updateHref({ showFilters: !this.props.showFilters });
  }

  // Path with new props
  updateHref(updates: Partial<RouteProps>) {
    let { groupId, showFilters, eventId, labels, period } = this.props;
    return eventList.href({
      groupId, showFilters, eventId, labels, period,
      ...updates
    });
  }
}

export default GroupEvents;
