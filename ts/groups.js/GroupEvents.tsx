/*
  This is the main view for the group page
*/

import * as React from 'react';
import * as classNames from 'classnames';
import { eventList } from "./paths";
import { State, DispatchFn } from './types';
import delay from "../components/DelayedControl";
import Icon from "../components/Icon";
import PeriodSelector from "../components/PeriodSelector";
import EventEditor from "../components/EventEditor";
import ScrollContainer from "../components/ScrollContainer";
import GroupCalcDisplay from "./GroupCalcDisplay";
import GroupEventsList from "./GroupEventsList";
import GroupFiltersSelector from "./GroupFiltersSelector";
import * as Events from "../handlers/group-events";
import { ApiSvc } from "../lib/api";
import * as ApiT from "../lib/apiT";
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
              state={this.props.state}
              query={value}
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
              { this.renderEventDates() }
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

        { this.renderSingleEvent() }
      </div>
    </div>;
  }

  renderCalcDisplay() {
    let key = calcKey(this.props.period, this.props.query);
    let results = (this.props.state.groupCalcs[this.props.groupId] || {})[key];
    return <GroupCalcDisplay results={results} />;
  }

  renderEventDates() {
    return <GroupEventsList
      {...this.props}
      eventHrefFn={this.eventHref}
      labelHrefFn={this.labelHref}
    />;
  }

  renderSingleEvent() {
    if (this.props.eventId) {
      let eventMap = this.props.state.groupEvents[this.props.groupId] || {};
      let members = this.props.state.groupMembers[this.props.groupId];
      let group = this.props.state.groupLabels[this.props.groupId];
      let labels = ready(group) ? group.group_labels : [];
      return <EventEditor
        event={eventMap[this.props.eventId]}
        members={members}
        labels={labels}
        loginDetails={this.props.state.login}
        onChange={(label, active) => Events.setGroupEventLabels({
          groupId: this.props.groupId,
          eventIds: this.props.eventId ? [this.props.eventId] : [],
          label, active
        }, this.props)}
        onForceInstance={() => Events.setGroupEventLabels({
          groupId: this.props.groupId,
          eventIds: this.props.eventId ? [this.props.eventId] : []
        }, this.props, { forceInstance: true })}
        onHide={(hidden) => Events.setGroupEventLabels({
          groupId: this.props.groupId,
          eventIds: this.props.eventId ? [this.props.eventId] : [],
          hidden
        }, this.props)}
        onCommentPost={(eventId, text) =>
          Events.postGroupEventComment({
            groupId: this.props.groupId,
            eventId,
            text
          }, {...this.props})
        }
        onCommentDelete={(eventId, commentId) =>
          Events.deleteGroupEventComment({
            groupId: this.props.groupId,
            eventId,
            commentId
          }, {...this.props})
        }
        labelHrefFn={this.labelHref}
        guestHrefFn={this.guestHref}
      />
    }
    return null; // No event
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
