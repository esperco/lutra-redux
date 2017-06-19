/*
  Groups-specific wrapper around event list component
*/
require("less/components/_group-events-list.less");
import * as _ from "lodash";
import * as React from "react";
import { generalSettings } from "./paths";
import { State as StoreState, DispatchFn, PostTaskFn } from './types';
import CheckboxItem from "../components/CheckboxItem";
import { EventConfirmBox } from "../components/EventConfirmBox";
import { InlineInfo, Title } from "../components/EventInfo";
import EventPredictionsList from "../components/EventPredictionsList";
import LabelList from "../components/LabelList";
import QueryDayList from "../components/QueryDayList";
import * as Events from "../handlers/events";
import { ApiSvc } from "../lib/api";
import * as ApiT from "../lib/apiT";
import { LabelSet, useRecurringLabels } from "../lib/event-labels";
import { QueryFilter } from "../lib/event-queries";
import { GenericPeriod } from "../lib/period";
import { NavSvc } from "../lib/routing";
import { ready } from "../states/data-status";
import * as CommonText from "../text/common";
import * as EventText from "../text/events";
import * as GroupText from "../text/groups";

interface Props {
  groupId: string;
  period: GenericPeriod;
  query: QueryFilter;
  eventHrefFn: (ev: ApiT.GenericCalendarEvent) => string;
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
  selectedRecurringIds: Record<string, true>;
}

export class EventsList extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      selectedRecurringIds: this.getRecurringSelectedIds(props)
    };
  }

  /*
    Update which events are selected by virtue of being recurring events
    on each props update so we can show which events are selected.
  */
  componentWillReceiveProps(props: Props) {
    this.setState({
      selectedRecurringIds: this.getRecurringSelectedIds(props)
    });
  }

  getRecurringSelectedIds(props: Props) {
    let selectedRecurringIds: Record<string, true> = {};
    for (let key in this.props.state.selectedEvents) {
      let events = this.props.state.events[this.props.groupId] || {};
      let event = events[key];
      if (ready(event) && useRecurringLabels(event)) {
        selectedRecurringIds[event.recurring_event_id] = true;
      }
    }
    return selectedRecurringIds;
  }

  render() {
    let { groupId: calgroupId, state, period } = this.props;
    let noContentMessage = GroupText.noContentMessage(
      generalSettings.href({ groupId: calgroupId })
    );

    return <QueryDayList
      className="group-events-list"
      maxDays={this.props.Conf && this.props.Conf.maxDaysFetch}
      calgroupId={calgroupId}
      period={period}
      state={state}
      query={{}}
      cb={(events) => <EventPredictionsList
        className="panel"
        events={events}
        cb={this.renderEvent}
      />}

      /*
        Render select all only if all events are here since we can't really
        select all if we don't know which events to selet.
      */
      onLoadPrefix={(total) => total ?
        this.renderSelectAll() : noContentMessage}
      onLoadSuffix={(total) => total ?
        this.renderSelectAll() : null}
    />;
  }

  renderSelectAll() {
    // Some selected -> de-select
    if (_.size(this.props.state.selectedEvents) > 0) {
      if (this.props.clearAllHrefFn) {
        let url = this.props.clearAllHrefFn();
        return <button className="secondary"
        onClick={() => this.props.Svcs.Nav.go(url)}>
          { CommonText.ClearAll }
        </button>;
      }
      return null;
    }

    // Else show select all
    if (this.props.selectAllHrefFn) {
      let url = this.props.selectAllHrefFn();
      return <button className="secondary"
      onClick={() => this.props.Svcs.Nav.go(url)}>
        { CommonText.SelectAll }
      </button>;
    }
    return null;
  }

  renderEvent = (event: ApiT.GenericCalendarEvent) => {
    let selected = !!(this.props.state.selectedEvents[event.id] ||
      (useRecurringLabels(event) &&
       this.state.selectedRecurringIds[event.recurring_event_id]));

    return <EventConfirmBox key={event.id}
      className="panel" event={event}
      onConfirm={() => this.confirm(event.id, true)}>
      <div>
        <h4 onClick={() => this.confirm(event.id, false)}>
          <CheckboxItem checked={selected}
                        onChange={(v) => this.toggleSelect(event.id, v)}>
            <span className="sr-only">{ EventText.Select }</span>
          </CheckboxItem>
          <Title event={event} href={this.props.eventHrefFn(event)} />
        </h4>

        <button className="hide-btn"
                onClick={() => this.hideChange(event.id, !event.hidden)}>
          { event.hidden ? CommonText.Show : CommonText.Hide }
        </button>

        <InlineInfo event={event} />
      </div>

      { event.hidden ? null : <LabelList
        labels={this.props.labels}
        searchLabels={this.props.searchLabels}
        events={[event]}
        onChange={this.onLabel}
        labelHrefFn={this.props.labelHrefFn}
      /> }
    </EventConfirmBox>;
  }

  onLabel = (eventIds: string[], label: ApiT.LabelInfo, active: boolean) => {
    Events.setGroupEventLabels({
      groupId: this.props.groupId,
      eventIds, label, active,
      context: {
        period: this.props.period,
        query: this.props.query
      }
    }, this.props);
  }

  confirm(eventId: string, passive: boolean) {
    Events.setGroupEventLabels({
      groupId: this.props.groupId,
      eventIds: [ eventId ],
      passive
    }, this.props);
  }

  hideChange(eventId: string, hidden: boolean) {
    Events.setGroupEventLabels({
      groupId: this.props.groupId,
      eventIds: [eventId],
      hidden,
      context: {
        period: this.props.period,
        query: this.props.query
      }
    }, this.props);
  }

  toggleSelect(eventId: string, value: boolean) {
    if (this.props.toggleHrefFn) {
      let url = this.props.toggleHrefFn(eventId, value);
      this.props.Svcs.Nav.go(url);
    }
  }
}

export default EventsList;
