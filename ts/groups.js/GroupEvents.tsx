/*
  This is the main view for the group page
*/

import * as _ from 'lodash';
import * as React from 'react';
import * as classNames from 'classnames';
import { eventList } from "./paths";
import { State, DispatchFn } from './types';
import delay from "../components/DelayedControl";
import Icon from "../components/Icon";
import PeriodSelector from "../components/PeriodSelector";
import ScrollContainer from "../components/ScrollContainer";
import GroupCalcDisplay from "./GroupCalcDisplay";
import GroupEventEditor from "./GroupEventEditor";
import GroupEventsList from "./GroupEventsList";
import GroupFiltersSelector from "./GroupFiltersSelector";
import * as Events from "../handlers/group-events";
import { ApiSvc } from "../lib/api";
import * as ApiT from "../lib/apiT";
import { guestSetFromGroupMembers, GuestSet } from "../lib/event-guests";
import { LabelSet } from "../lib/event-labels";
import { QueryFilter, reduce } from "../lib/event-queries";
import { GenericPeriod } from "../lib/period";
import { NavSvc } from "../lib/routing";
import { ready } from "../states/data-status";
import { calcKey } from "../states/group-calcs";

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
  Conf?: { maxDaysFetch?: number; }
}

class GroupEvents extends React.Component<Props, {}> {
  render() {
    let { labels, searchLabels } = this.getLabels();
    let searchGuests = this.getGuests();

    return <div className={classNames("sidebar-layout", {
      "show-left": this.props.showFilters,
      "hide-left": this.props.showFilters === false,
      "show-right": !!this.props.eventId
    })}>

      {/* Filters Sidebar -- delayed URL update */}
      { delay({
          value: this.props.query,
          onChange: (query) => this.update({ query }),
          component: ({ value, onChange, onSubmit }) =>
            <GroupFiltersSelector
              className="sidebar panel"
              groupId={this.props.groupId}
              query={value}
              searchGuests={searchGuests}
              searchLabels={searchLabels}
              onChange={onChange}
              onSubmit={onSubmit}
            />
        }) }

      {/* Main Content Area */}
      <div className="content">
        <div className="rowbar-layout">
          <header>
            {/*
              Open/close filters sidebar -- two different button for switching
              and toggling behavior (display controlled by CSS).
            */}
            <span className="btn-set">
              <button className="show-left-btn"
                      onClick={() => this.showFilters()}>
                <Icon type="filters" />
              </button>
              <button className="switch-left-btn"
                      onClick={() => this.switchFilters()}>
                <Icon type="filters" />
              </button>
              <button className="hide-left-btn"
                      onClick={() => this.hideFilters()}>
                <Icon type="close" />
              </button>
            </span>

            {/* Select which period to show events for */}
            <PeriodSelector
              value={this.props.period}
              onChange={(p) => this.update({ period: p })}
            />

            { /* Refresh event list */ }
            <button onClick={this.refresh}>
              <Icon type="refresh" />
            </button>
          </header>

          <ScrollContainer
            className="content"
            onScrollChange={(direction) => this.props.dispatch({
              type: "SCROLL", direction
            })}>
            <div className="container">
              { this.renderCalcDisplay() }
              { this.renderEventDates({ labels, searchLabels }) }
            </div>
          </ScrollContainer>
        </div>
        <a className="backdrop" href={this.backdropHref()} />
      </div>

      {/* Additional event info goes here (if applicable) */}
      <div className="sidebar panel">
        <button className="close-btn" onClick={() => this.update({
          eventId: undefined
        })}>
          <Icon type="close" />
        </button>

        { this.renderSingleEvent({ labels, searchLabels }) }
      </div>
    </div>;
  }

  renderCalcDisplay() {
    let key = calcKey(this.props.period, this.props.query);
    let results = (this.props.state.groupCalcs[this.props.groupId] || {})[key];
    return <GroupCalcDisplay results={results} />;
  }

  renderEventDates({ labels, searchLabels }: {
    labels: LabelSet;
    searchLabels: LabelSet;
  }) {
    return <GroupEventsList
      {...this.props}
      labels={labels}
      searchLabels={searchLabels}
      eventHrefFn={this.eventHref}
      labelHrefFn={this.labelHref}
    />;
  }

  renderSingleEvent({ labels, searchLabels }: {
    labels: LabelSet;
    searchLabels: LabelSet;
  }) {
    if (this.props.eventId) {
      return <GroupEventEditor
        {...this.props}
        eventId={this.props.eventId}
        guestHrefFn={this.guestHref}
        labelHrefFn={this.labelHref}
      />;
    }
    return null; // No event
  }

  // Create LabelSet from suggestions to pass down
  getLabels() {
    let { groupId, state } = this.props;
    let groupLabels = state.groupLabels[groupId];
    let labelSuggestions = state.groupLabelSuggestions[groupId] || {};
    let labels = new LabelSet(
      ready(groupLabels) ? groupLabels.group_labels : []
    );
    let searchLabels = labels.with(... _.values(labelSuggestions));
    labels.sort();
    searchLabels.sort();
    return { labels, searchLabels };
  }

  // Create GuestSet from suggestions to pass down
  getGuests() {
    let { groupId, state } = this.props;
    let groupMembers = state.groupMembers[groupId];
    let guests = ready(groupMembers) ?
      guestSetFromGroupMembers(groupMembers) : new GuestSet([]);
    let guestSuggestions = _.values(state.groupGuestSuggestions[groupId]);
    guests.push(...guestSuggestions);
    guests.sort();
    return guests;
  }

  // Toggling filters is just a hashchange
  showFilters() {
    this.update({ showFilters: true });
  }

  switchFilters() {
    this.update({
      showFilters: true,
      eventId: undefined
    });
  }

  hideFilters() {
    this.update({ showFilters: false });
  }

  backdropHref() {
    return this.updateHref({
      showFilters: false,
      eventId: undefined
    });
  }

  // Path with new props
  updateHref(updates: Partial<RouteProps>) {
    let { groupId, showFilters, eventId, period } = this.props;
    let query = reduce(updates.query || this.props.query);
    return eventList.href({
      groupId, showFilters, eventId, period, ...query, ...updates
    });
  }

  eventHref = (event: ApiT.GenericCalendarEvent) => {
    return this.updateHref({
      eventId: event.id
    });
  }

  guestHref = (guest: ApiT.Attendee) => {
    return this.updateHref({
      query: { participant: [guest.email] }
    });
  }

  labelHref = (label: ApiT.LabelInfo) => {
    return this.updateHref({
      query: { labels: { some: { [label.normalized]: true }}}
    });
  }

  update(updates: Partial<RouteProps>) {
    this.props.Svcs.Nav.go(this.updateHref(updates));
  }

  refresh = () => {
    let { groupId, period } = this.props;
    Events.refresh({ groupId, period }, this.props);
  }
}

export default GroupEvents;
