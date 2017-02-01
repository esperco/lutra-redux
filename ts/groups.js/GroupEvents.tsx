/*
  This is the main view for the group page
*/

import * as _ from 'lodash';
import * as React from 'react';
import * as classNames from 'classnames';
import { eventList } from "./paths";
import { State, DispatchFn, PostTaskFn } from './types';
import delay from "../components/DelayedControl";
import Icon from "../components/Icon";
import PeriodSelector from "../components/PeriodSelector";
import ScrollContainer from "../components/ScrollContainer";
import Tooltip from "../components/Tooltip";
import GroupCalcDisplay from "./GroupCalcDisplay";
import GroupEventEditor from "./GroupEventEditor";
import GroupMultiEventEditor from "./GroupMultiEventEditor";
import GroupEventsList from "./GroupEventsList";
import GroupFiltersSelector from "./GroupFiltersSelector";
import * as Events from "../handlers/group-events";
import { ApiSvc } from "../lib/api";
import * as ApiT from "../lib/apiT";
import { guestSetFromGroupMembers, GuestSet } from "../lib/event-guests";
import { LabelSet } from "../lib/event-labels";
import { QueryFilter, reduce } from "../lib/event-queries";
import { GenericPeriod, fromDates } from "../lib/period";
import { NavSvc } from "../lib/routing";
import { ready } from "../states/data-status";
import { calcKey } from "../states/group-calcs";
import * as EventText from "../text/events";
import * as FilterText from "../text/filters";
import * as PeriodText from "../text/periods";

class RouteProps {
  groupId: string;
  showFilters?: boolean;
  eventId?: string;
  selectAll?: boolean;
  query: QueryFilter;
  period: GenericPeriod;
}

class Props extends RouteProps {
  state: State;
  dispatch: DispatchFn;
  postTask: PostTaskFn;
  Svcs: ApiSvc & NavSvc;
  Conf?: { maxDaysFetch?: number; };
}

class GroupEvents extends React.Component<Props, {}> {
  render() {
    let { labels, searchLabels } = this.getLabels();
    let searchGuests = this.getGuests();
    let now = new Date();

    return <div className={classNames("sidebar-layout", {
      "show-left": this.props.showFilters,
      "hide-left": this.props.showFilters === false,
      "show-right": _.size(this.props.state.selectedEvents) > 0
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
              presets={[{
                displayAs: PeriodText.Today,
                value: fromDates(now, now)
              }, {
                displayAs: PeriodText.ThisWeek,
                value: fromDates("week", now, now)
              }, {
                displayAs: PeriodText.ThisMonth,
                value: fromDates("month", now, now)
              }]}
            />

            { /* Refresh event list */ }
            <Tooltip
              target={<button onClick={this.refresh}>
                <Icon type="refresh" />
              </button>}
              title={EventText.Refresh}
            />
          </header>

          <ScrollContainer
            className="content"
            onScrollChange={(direction) => this.props.dispatch({
              type: "SCROLL", direction
            })}>
            <div className="container">
              { this.renderFilterAlert(searchLabels) }
              { this.renderCalcDisplay(searchLabels) }
              { this.renderEventDates({ labels, searchLabels }) }
            </div>
          </ScrollContainer>
        </div>
        <a className="backdrop" href={this.backdropHref()} />
      </div>

      {/* Additional event info goes here (if applicable) */}
      <div className="sidebar panel">
        <button className="close-btn"
                onClick={() => this.props.Svcs.Nav.go(this.clearAllHref())}>
          <Icon type="close" />
        </button>

        { this.renderEventSidebar({ labels, searchLabels }) }
      </div>
    </div>;
  }

  renderFilterAlert(searchLabels: LabelSet) {
    if (_.isEmpty(this.props.query)) return null;

    return <div className="alert info">
      <button onClick={() => this.update({ query: {} })}>
        { FilterText.Reset }
      </button>
      { FilterText.filterText(this.props.query, searchLabels) }
    </div>;
  }

  renderCalcDisplay(searchLabels: LabelSet) {
    let key = calcKey(this.props.period, this.props.query);
    let results = (this.props.state.groupCalcs[this.props.groupId] || {})[key];
    return <GroupCalcDisplay
      results={results}
      labels={searchLabels}
      labelHrefFn={this.labelHref}
    />;
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
      clearAllHrefFn={this.clearAllHref}
      selectAllHrefFn={this.selectAllHref}
    />;
  }

  renderEventSidebar(labelProps: {
    labels: LabelSet;
    searchLabels: LabelSet;
  }) {
    let numEvents = _.size(this.props.state.selectedEvents);
    if (numEvents === 0) return null;
    if (numEvents === 1) {
      return <GroupEventEditor
        {...this.props}
        {...labelProps}
        guestHrefFn={this.guestHref}
        labelHrefFn={this.labelHref}
      />;
    }

    return <GroupMultiEventEditor
      {...this.props}
      {...labelProps}
      labelHrefFn={this.labelHref}
    />;
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

  eventHref = (eventOrId: ApiT.GenericCalendarEvent|string) => {
    let eventId = typeof eventOrId === "string" ?
      eventOrId : (eventOrId && eventOrId.id);
    return this.updateHref({ eventId });
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

  selectAllHref = () => this.updateHref({
    selectAll: true,
    eventId: undefined
  });

  clearAllHref = () => this.updateHref({
    selectAll: undefined,
    eventId: undefined
  });

  update(updates: Partial<RouteProps>) {
    this.props.Svcs.Nav.go(this.updateHref(updates));
  }

  refresh = () => {
    let { groupId, period } = this.props;
    Events.refresh({ groupId, period }, this.props);
  }
}

export default GroupEvents;
