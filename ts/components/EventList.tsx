/*
  A simple list of events
*/
import * as _ from "lodash";
import * as moment from "moment";
import * as React from "react";
import * as ApiT from "../lib/apiT";
import CheckboxItem from "./CheckboxItem";
import Icon from "./Icon";
import LabelList from "./LabelList";
import TimebombToggle from "./TimebombToggle";
import Tooltip from "./Tooltip";
import Waypoint from "./Waypoint";
import * as classNames from "classnames";
import { LabelSet, useRecurringLabels } from "../lib/event-labels";
import { ok, ready, StoreData } from "../states/data-status";
import * as CommonText from "../text/common";
import * as EventText from "../text/events";

// Viewing event in list will confirm its labels after this time in ms
const DEFAULT_AUTO_CONFIRM_TIMEOUT = 3000;

export interface SharedProps {
  eventHrefFn?: (ev: ApiT.GenericCalendarEvent) => string;
  labelHrefFn?: (l: ApiT.LabelInfo) => string;
  labels: LabelSet;          // For LabelList
  searchLabels: LabelSet;    // For LabelList
  onChange: (
    eventIds: string[],
    x: ApiT.LabelInfo,
    active: boolean
  ) => void;
  onHideChange: (eventIds: string[], hidden: boolean) => void;
  onConfirm?: (eventIds: string[]) => void;

  // NB: Batch timebomb toggle not supported yet
  onTimebombToggle?: (eventId: string, value: boolean) => void;

  autoConfirmTimeout?: number;
  onToggleSelect?: (eventId: string, val: boolean) => void;
}

export interface ListProps extends SharedProps {
  events: (StoreData<ApiT.GenericCalendarEvent>|undefined)[];
  selectedEventIds?: Record<string, true>;
  selectedRecurringIds?: Record<string, true>;
}

interface ListState {
  /*
    By default, we minimize hidden events (unless those events need
    confirmation) within a given list and show a notice to the user that
    we've done so. This state variable stores a record of event IDs that are
    hidden and should not be rendered.

    Events are hidden only on first render. Subsequent updates should not hide
    more events because we want the user to be able to re-toggle a hidden event
    back to shown if they hide it.
  */
  hiddenEvents?: Record<string, true>;
}

export class EventList extends React.Component<ListProps, ListState> {
  constructor(props: ListProps) {
    super(props);
    this.state = {
      hiddenEvents: this.getHiddenEvents(props)
    };
  }

  componentWillReceiveProps(newProps: ListProps) {
    // Update hidden events iff it hasn't been set already
    if (! this.state.hiddenEvents) {
      this.setState({
        hiddenEvents: this.getHiddenEvents(newProps)
      });
    }
  }

  /*
    Returns the event ID recordwe're hiding for a given prop set (or undefined
    if events aren't ready yet.
  */
  getHiddenEvents(props: ListProps) {
    let ret: Record<string, true> = {};
    for (let i in props.events) {
      let event = props.events[i];

      // Not ready -> return undefined, don't update hidden state
      if (! ready(event)) { return; }

      if (event.hidden && event.labels_confirmed) {
        ret[event.id] = true;
      }
    }
    return ret;
  }

  isSelected(ev: ApiT.GenericCalendarEvent) {
    return (
      (this.props.selectedEventIds &&
        !!this.props.selectedEventIds[ev.id]) ||
      (this.props.selectedRecurringIds &&
        useRecurringLabels(ev) &&
        !!this.props.selectedRecurringIds[ev.recurring_event_id])
    );
  }

  render() {
    return <div className="event-list panel">
      { this.renderHiddenEventMsg() }
      { _.map(this.props.events, (ev, i) => this.renderEvent(ev, i)) }
    </div>;
  }

  renderHiddenEventMsg() {
    let numHiddenEvents = _.size(this.state.hiddenEvents || {});
    if (! numHiddenEvents) return null;

    return <div className="hidden-events panel">
      <Tooltip
        title={EventText.HiddenEventsDescription}
        target={<button onClick={() => this.showHiddenEvents()}>
          { EventText.hiddenEventsMsg(numHiddenEvents) }
        </button>}
      />
    </div>;
  }

  renderEvent(
    ev: StoreData<ApiT.GenericCalendarEvent>|undefined,
    index: number
  ) {
    if (! ok(ev)) {
      return null;
    }
    if (ev === "FETCHING") {
      return <PlaceholderEvent key={index} />;
    }
    if (this.state.hiddenEvents && this.state.hiddenEvents[ev.id]) {
      return null; // Hidden
    }
    return <EventDisplay key={ev.id} event={ev}
      { ...this.props }
      selected={this.isSelected(ev)}
    />;
  }

  showHiddenEvents() {
    this.setState({
      hiddenEvents: {}
    });
  }
}


export interface EventProps extends SharedProps {
  event: ApiT.GenericCalendarEvent;
  selected?: boolean;
}

interface EventState {
  // Track confirmation in state because we want to persist indications
  // of confirmation even after auto-confirming
  confirmed: boolean;
}

export class EventDisplay extends React.Component<EventProps, EventState> {
  _timeout?: number;

  constructor(props: EventProps) {
    super(props);
    this.state = {
      confirmed: !!props.event.labels_confirmed
    };
  }

  // Change display to confirmed if result of labeling action
  componentWillReceiveProps(newProps: EventProps) {
    if (!this.state.confirmed && newProps.event.labels_confirmed) {
      let newLabelLength = (newProps.event.labels || []).length;
      let oldLabelLength = (this.props.event.labels || []).length;
      if (newLabelLength !== oldLabelLength) {
        this.setState({ confirmed: true })
      }
    }
  }

  // Don't fire confirmation timeout if we skipped past it really fast
  componentWillUnmount() {
    if (typeof this._timeout !== "undefined") {
      clearTimeout(this._timeout);
    }
  }

  render() {
    let { event } = this.props;
    let title = event.title ?
      <span>{ event.title }</span> :
      <span className="no-title">{ EventText.NoTitle }</span>;

    return <div className={classNames("event", "panel", {
      unconfirmed: !this.state.confirmed,
      hidden: event.hidden === true,
      "has-predictions": event.labels_predicted
    })}>
      <div className="event-body">
        <h4>
          {
            this.props.onToggleSelect ?
            <CheckboxItem checked={this.props.selected} onChange={this.select}>
              <span className="sr-only">{ EventText.Select }</span>
            </CheckboxItem> : null
          } {
            this.props.eventHrefFn ?
            <a href={this.props.eventHrefFn(event)}
              onClick={() => this.confirm(true)}>
              { title }
            </a> : title
          }
        </h4>

        <button className="hide-btn" onClick={() => this.toggleHide()}>
          { event.hidden ? CommonText.Show : CommonText.Hide }
        </button>

        <div className="event-info">
          <div className="time">
            <span className="start">
              { moment(event.start).format("h:mm a") }
            </span>{" to "}<span className="end">
              { moment(event.end).format("h:mm a") }
            </span>{" "}

            { event.recurring_event_id ?
              <Tooltip
                target={<span className="recurring">
                  <Icon type="repeat" />
                </span>}
                title={EventText.Recurring}
              /> : null }
          </div>

          { event.guests && event.guests.length ? <span className="guests">
            { EventText.attendeeMsgShort(
              _.map(event.guests, (g) => g.display_name || g.email)
            ) }
          </span> : null }

          { event.merged && event.merged.cost ?
            <span className={"cost cost-" + event.merged.cost }>
              { _.repeat("$", event.merged.cost) }
            </span> : null }
        </div>

        { !event.labels_confirmed ?
          <span className="confirm-waypoint">
            <Waypoint
              fireOnRapidScroll={false}
              onEnter={this.setConfirmTimeout}
              onLeave={this.clearConfirmTimeout}
            />
          </span> : null }

        <div className="event-actions">
          <LabelList
            labels={this.props.labels}
            searchLabels={this.props.searchLabels}
            events={[event]}
            onChange={this.props.onChange}
            labelHrefFn={this.props.labelHrefFn}
          />

          { event.comments.length ?
            <span className="comment-count">
              { this.props.eventHrefFn ?
                <a href={this.props.eventHrefFn(event)}>
                  <Icon type="comments">
                    { event.comments.length }
                  </Icon>
                </a> : <Icon type="comments" /> }
            </span>
            : null }
        </div>
      </div>

      <div className="event-primary-action">
        { this.props.onTimebombToggle ?
          <TimebombToggle
            event={event}
            onToggle={this.props.onTimebombToggle}
          /> : null }
      </div>
    </div>;
  }

  select = (v: boolean) => {
    if (this.props.onToggleSelect) {
      this.props.onToggleSelect(this.props.event.id, v);
    }
  }

  confirm(explicit=false) {
    if (explicit && !this.state.confirmed) {
      this.setState({ confirmed: true });
    }

    let { event } = this.props;
    if (!event.labels_confirmed && this.props.onConfirm) {
      this.props.onConfirm([event.id]);
    }
  }

  // Once event has been viewed. Auto-confirm after a short timeout.
  setConfirmTimeout = () => {
    if (typeof this._timeout === "undefined" &&
        this.props.autoConfirmTimeout !== Infinity) {
      this._timeout = setTimeout(() => this.confirm(false),
        this.props.autoConfirmTimeout || DEFAULT_AUTO_CONFIRM_TIMEOUT);
    }
  }

  clearConfirmTimeout = () => {
    if (typeof this._timeout !== "undefined") {
      clearTimeout(this._timeout);
      delete this._timeout;
    }
  }

  toggleHide() {
    this.props.onHideChange([this.props.event.id], !this.props.event.hidden);
  }
}

export function PlaceholderEvent({} : {}) {
  return <div className="event">
    <div className="placeholder" />
    <div className="placeholder" />
    <div className="placeholder" />
  </div>;
}


export default EventList;

