/*
  Groups-specific wrapper around event list component
*/
import * as _ from "lodash";
import * as $ from "jquery";
import * as React from "react";
import { State as StoreState, DispatchFn } from './types';
import DayBox from "../components/DayBox";
import EventList, { SharedProps } from "../components/EventList";
import Waypoint from "../components/Waypoint";
import * as Events from "../handlers/group-events";
import { ApiSvc } from "../lib/api";
import * as ApiT from "../lib/apiT";
import { LabelSet } from "../lib/event-labels";
import { QueryFilter, stringify } from "../lib/event-queries";
import { GenericPeriod, toDays, dateForDay } from "../lib/period";
import { StoreData } from "../states/data-status";
import { EventMap, QueryResult } from "../states/group-events";
import { Loading } from "../text/data-status";

interface Props {
  groupId: string;
  period: GenericPeriod;
  query: QueryFilter;
  eventHrefFn?: (ev: ApiT.GenericCalendarEvent) => string;
  labelHrefFn?: (l: ApiT.LabelInfo) => string;
  labels: LabelSet;
  searchLabels: LabelSet;
  state: StoreState;
  dispatch: DispatchFn;
  Svcs: ApiSvc;
  Conf?: { maxDaysFetch?: number; }
}

interface State {
  daysToShow: number;
}

export class GroupEventsList extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { daysToShow: this.getDaysIncr() };
  }

  componentWillReceiveProps(nextProps: Props) {
    if (! _.isEqual(this.props.period, nextProps.period)) {
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

    return <div className="group-events-list">
      { _.map(queryDays, (d, i) =>
        <QueryDay key={i} day={start + i} result={d[queryKey]}
          eventMap={eventMap}
          { ...this.props }
          onChange={this.onChange}
          onConfirm={this.onConfirm}
          onHideChange={this.onHideChange}
        />
      ) }

      { canShowMore ?
        /* Use different key so it re-updates if nothing new in update */
        <div className="loading-msg">
          <Waypoint key={endToShow} onEnter={this.showMore} />
          { Loading }
        </div> : null }
    </div>;
  }

  onChange = (eventIds: string[], label: ApiT.LabelInfo, active: boolean) => {
    Events.setGroupEventLabels({
      groupId: this.props.groupId,
      eventIds, label, active
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
      eventIds, hidden
    }, this.props);
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
  eventMap: EventMap;
}

/*
  QueryDay component should update if and only if visible. Waypoints are added
  to top and bottom (or just one waypoint if not content) which force an
  update when we scroll into view.
*/
class QueryDay extends React.Component<DayProps, {}> {
  _ref: HTMLElement;
  _pending: boolean;

  componentWillReceiveProps() {
    this._pending = true; // New props, signal that there is an update queued
  }

  shouldComponentUpdate() {
    // Update if visible
    if (this._ref) {
      let top = $(this._ref).position().top;
      let bottom = top + $(this._ref).outerHeight();
      let parent = $(this._ref).offsetParent();
      return top <= parent.outerHeight() && bottom >= 0;
    }

    // Edge case -- ref missing for whatever reason? Return true to be safe.
    return true;
  }

  componentDidUpdate() {
    this._pending = false;
  }

  render() {
    if (! this.props.result || this.props.result === "FETCH_ERROR") {
      return this.renderEmpty();
    }

    let calEvents: (StoreData<ApiT.GenericCalendarEvent>|undefined)[] =
      this.props.result === "FETCHING" ? ["FETCHING"] :
      _.map(this.props.result.eventIds, (id) => this.props.eventMap[id]);

    if (_.isEmpty(calEvents)) return this.renderEmpty();;

    return <div ref={(c) => this._ref = c}>
      <Waypoint onEnter={this.maybeUpdate} />
      <DayBox date={dateForDay(this.props.day)}>
        {/*
          Wrap EventList with extra div so flexbox doesn't expand height of
          EventList when it's too short.
        */}
        <div><EventList events={calEvents} {...this.props} /></div>
      </DayBox>
      <Waypoint onEnter={this.maybeUpdate} />
    </div>;
  }

  /*
    Need to render something (rather than null) if no data so we
    can check visibility when deciding whether to update. Use a span
    (since that shouldn't affect * + * CSS selectors or other spacing)
  */
  renderEmpty() {
    return <span ref={(c) => this._ref = c}>
      <Waypoint onEnter={this.maybeUpdate} />
    </span>
  }

  // Update only if there is a pending udpate for this day
  maybeUpdate = () => {
    if (this._pending) {
      this._pending = false; // Set false right away in case function fired
                             // multiple times (e.g. because two waypoints)
      this.forceUpdate();
    }
  }
}

export default GroupEventsList;
