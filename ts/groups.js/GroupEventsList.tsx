/*
  Groups-specific wrapper around event list component
*/
import * as _ from "lodash";
import * as React from "react";
import { generalSettings } from "./paths";
import { State as StoreState, DispatchFn, PostTaskFn } from './types';
import DayBox from "../components/DayBox";
import EventList, { SharedProps } from "../components/EventList";
import TreeFall from "../components/TreeFall";
import Waypoint from "../components/Waypoint";
import * as Events from "../handlers/group-events";
import { ApiSvc } from "../lib/api";
import * as ApiT from "../lib/apiT";
import { LabelSet, useRecurringLabels } from "../lib/event-labels";
import { QueryFilter, stringify } from "../lib/event-queries";
import { iter } from "../lib/event-query-iter";
import { GenericPeriod, toDays, dateForDay } from "../lib/period";
import { NavSvc } from "../lib/routing";
import { StoreData, ready } from "../states/data-status";
import { EventMap, QueryResult } from "../states/group-events";
import { Loading } from "../text/data-status";
import * as CommonText from "../text/common";
import * as GroupText from "../text/groups";

interface Props {
  groupId: string;
  period: GenericPeriod;
  query: QueryFilter;
  eventHrefFn?: (ev: ApiT.GenericCalendarEvent) => string;
  labelHrefFn?: (l: ApiT.LabelInfo) => string;
  clearAllHrefFn?: () => string;
  selectAllHrefFn?: () => string;
  toggleHrefFn?: (eventId: string, value: boolean) => string;
  labels: LabelSet;
  searchLabels: LabelSet;
  state: StoreState;
  dispatch: DispatchFn;
  postTask: PostTaskFn;
  Svcs: ApiSvc & NavSvc;
  Conf?: { maxDaysFetch?: number; };
}

interface State {
  daysToShow: number;
}

export class GroupEventsList extends React.Component<Props, State> {
  // Sparsely-populated array. Indices refer to the period type's day-index
  _refs: QueryDay[];

  constructor(props: Props) {
    super(props);
    this._refs = [];
    this.state = { daysToShow: this.getDaysIncr() };
  }

  componentWillReceiveProps(nextProps: Props) {
    if (! _.isEqual(this.props.period, nextProps.period)) {
      this._refs = [];
      this.setState({ daysToShow: this.getDaysIncr() });
    }
  }

  getDaysIncr() {
    return (this.props.Conf && this.props.Conf.maxDaysFetch) || Infinity;
  }

  render() {
    let { groupId, state, period, query } = this.props;
    let queryState = state.groupEventQueries[groupId] || [];
    let eventMap = state.groupEvents[groupId] || {};

    let { start, end } = toDays(period);
    let endToShow = Math.min(start + this.state.daysToShow - 1, end);
    let queryDays = queryState.slice(start, endToShow + 1);
    let queryKey = stringify(query);

    // Only show more if we're not busy fetching stuff
    let canShowMore = endToShow < end &&
      !_.find(queryDays, (d) => d[queryKey] === "FETCHING")

    /* Determine if any recurring events are selected */
    let selectedRecurringIds: {[recurringId: string]: true} = {};
    for (let key in this.props.state.selectedEvents) {
      let events = this.props.state.groupEvents[groupId] || {};
      let event = events[key];
      if (ready(event) && useRecurringLabels(event)) {
        selectedRecurringIds[event.recurring_event_id] = true;
      }
    }

    /*
      Check if all events are loaded. Don't display certain elemetns if
      no events or if not loaded.
    */
    let total = 0;
    let loaded = iter(this.props, this.props.state, () => total += 1);

    return <div className="group-events-list">
      { /*
          Render select all only if all events are here since we can't really
          select all if we don't know which events to selet.
        */
        loaded && total > 0 ? this.renderSelectAll() : null }

      { loaded && !total ?
        GroupText.noContentMessage(generalSettings.href({ groupId })) :
        null }

      { _.map(queryDays, (d, i) =>
        <QueryDay key={i} day={start + i}
          ref={(c) => this._refs[start + i] = c}
          result={d[queryKey]}
          selectedEventIds={this.props.state.selectedEvents}
          selectedRecurringIds={selectedRecurringIds}
          eventMap={eventMap}
          { ...this.props }
          onChange={this.onChange}
          onConfirm={this.onConfirm}
          onHideChange={this.onHideChange}
          onToggleSelect={this.props.toggleHrefFn && this.onToggleSelect}
          autoConfirmTimeout={
            /* If admin, don't autoconfirm */
            this.props.state.loggedInAsAdmin ?
            Infinity : undefined
          }
        />
      ) }

      { canShowMore ?

        /* Use different key so it re-updates if nothing new in update */
        <div className="loading-msg">
          <Waypoint key={endToShow} onEnter={this.showMore} />
          { Loading }
        </div> :

        /* Select all button at end too */
        (loaded && total > 0 ? this.renderSelectAll() : null)
      }
    </div>;
  }

  renderSelectAll() {
    // Some selected -> de-select
    if (_.size(this.props.state.selectedEvents) > 0) {
      if (this.props.clearAllHrefFn) {
        let url = this.props.clearAllHrefFn();
        return <button onClick={() => this.props.Svcs.Nav.go(url)}>
          { CommonText.ClearAll }
        </button>;
      }
      return null;
    }

    // Else show select all
    if (this.props.selectAllHrefFn) {
      let url = this.props.selectAllHrefFn();
      return <button onClick={() => this.props.Svcs.Nav.go(url)}>
        { CommonText.SelectAll }
      </button>;
    }
    return null;
  }

  onChange = (eventIds: string[], label: ApiT.LabelInfo, active: boolean) => {
    Events.setGroupEventLabels({
      groupId: this.props.groupId,
      eventIds, label, active,
      context: {
        period: this.props.period,
        query: this.props.query
      }
    }, this.props);
  }

  onConfirm = (eventIds: string[]) => {
    Events.setGroupEventLabels({
      groupId: this.props.groupId,
      eventIds
    }, this.props);
  }

  onHideChange = (eventIds: string[], hidden: boolean) => {
    Events.setGroupEventLabels({
      groupId: this.props.groupId,
      eventIds, hidden,
      context: {
        period: this.props.period,
        query: this.props.query
      }
    }, this.props);
  }

  onToggleSelect = (eventId: string, value: boolean) => {
    if (this.props.toggleHrefFn) {
      let url = this.props.toggleHrefFn(eventId, value);
      this.props.Svcs.Nav.go(url);
    }
  }

  showMore = () => {
    let incr = this.props.Conf && this.props.Conf.maxDaysFetch;
    if (incr) {
      this.setState({
        daysToShow: this.state.daysToShow + this.getDaysIncr()
      });
    }
  }
}


interface DayProps extends SharedProps {
  day: number; // Period day index
  result: StoreData<QueryResult>;
  selectedEventIds: Record<string, true>;
  selectedRecurringIds: Record<string, true>;
  eventMap: EventMap;
}

/*
  QueryDay component should update if and only if visible. Waypoints are added
  to top and bottom (or just one waypoint if not content) which force an
  update when we scroll into view.
*/
class QueryDay extends TreeFall<DayProps, {}> {
  render() {
    if (! this.props.result || this.props.result === "FETCH_ERROR") {
      return this.renderEmpty();
    }

    let calEvents: (StoreData<ApiT.GenericCalendarEvent>|undefined)[] =
      this.props.result === "FETCHING" ? ["FETCHING"] :
      _.map(this.props.result.eventIds, (id) => this.props.eventMap[id]);

    if (_.isEmpty(calEvents)) return this.renderEmpty();;

    return <div>
      { this.renderWaypoint() }
      <DayBox date={dateForDay(this.props.day)}>
        {/*
          Wrap EventList with extra div so flexbox doesn't expand height of
          EventList when it's too short.
        */}
        <div><EventList
          events={calEvents}
          selectedEventIds={this.props.selectedEventIds}
          {...this.props}
        /></div>
      </DayBox>
      { this.renderWaypoint() }
    </div>;
  }

  /*
    Need to render something (rather than null) if no data so we
    can check visibility when deciding whether to update. Use a span
    (since that shouldn't affect * + * CSS selectors or other spacing)
  */
  renderEmpty() {
    return <span>
      { this.renderWaypoint() }
    </span>;
  }
}

export default GroupEventsList;
