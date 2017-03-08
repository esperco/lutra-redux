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
  loggedInUid?: string;
  eventHrefFn?: (ev: ApiT.GenericCalendarEvent) => string;
  labelHrefFn?: (l: ApiT.LabelInfo) => string;
  labels?: LabelSet;          // For LabelList
  searchLabels?: LabelSet;    // For LabelList
  onChange?: (
    eventIds: string[],
    x: ApiT.LabelInfo,
    active: boolean
  ) => void;
  onHideChange?: (eventIds: string[], hidden: boolean) => void;
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
    Unconfirmed events are depicted with a different style. We may auto-
    confirm that event but don't want to change the appearance of the event
    until the user explicitly confirms.

    This state variable stores a record of event IDs that are unconfirmed
    as of mount (or the first time we see that event)

    NB: We store unconfirmed status in the list component's state rather
    than the individual event's state because we need to know confirmation
    status for which hidden events to show (we don't hide unconfirmed hidden
    events because we want the user to visually inspect before we
    auto-confirm).
  */
  unconfirmed: Record<string, boolean>;

  // Sould we show hidden events?
  showHiddenEvents: boolean;
}

export class EventList extends React.Component<ListProps, ListState> {
  constructor(props: ListProps) {
    super(props);
    this.state = {
      unconfirmed: this.getUnconfirmed(props),
      showHiddenEvents: false
    };
  }

  componentWillReceiveProps(newProps: ListProps) {
    // Use callback to avoid issues with setState being called multiple times
    // and clobbering result of this.explicitConfirm
    this.setState((s) => ({
      ...s,
      /*
        Merge with existing implicit hidden (need explicit action from
        sub-component to remove from this state var).
      */
      unconfirmed: {
        ...this.getUnconfirmed(newProps),
        ...s.unconfirmed
      }
    }));
  }

  /*
    Returns the event ID record of unconfirmed events in props
  */
  getUnconfirmed(props: ListProps) {
    // Ignore unconfirmed status if no way to confirm
    if (! props.onConfirm) return {};

    let ret: Record<string, true> = {};
    for (let i in props.events) {
      let event = props.events[i];
      if (ready(event)) {
        if (!event.labels_confirmed) {
          ret[event.id] = true;
        }
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
    // Ignore if no way to toggle hidden events
    if (! this.props.onHideChange) return null;

    let numHiddenEvents = _.filter(this.props.events,
      (e) => ready(e) && e.hidden && !this.state.unconfirmed[e.id]
    ).length;
    if (! numHiddenEvents) return null;

    return <div className="hidden-events panel">
      <Tooltip
        title={EventText.HiddenEventsDescription}
        target={<button onClick={() => this.toggleHiddenEvents()}>
          { this.state.showHiddenEvents ?
            EventText.HideHidden :
            EventText.hiddenEventsMsg(numHiddenEvents) }
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
    if (ev.hidden && !this.state.unconfirmed[ev.id] &&
        !this.state.showHiddenEvents) {
      return null;
    }
    return <EventDisplay key={ev.id} event={ev}
      { ...this.props }
      unconfirmed={!!this.state.unconfirmed[ev.id]}
      onExplicitConfirm={this.explicitConfirm}
      selected={this.isSelected(ev)}
    />;
  }

  toggleHiddenEvents() {
    this.setState({
      ...this.state,
      showHiddenEvents: !this.state.showHiddenEvents
    });
  }

  explicitConfirm = (eventId: string) => {
    this.setState((s) => ({
      ...s,
      unconfirmed: {
        ...s.unconfirmed,
        [eventId]: false
      }
    }));
  }
}


export interface EventProps extends SharedProps {
  event: ApiT.GenericCalendarEvent;
  onExplicitConfirm: (eventId: string) => void;
  unconfirmed?: boolean; // Use in lieu of event.labels_confirmed
  selected?: boolean;
}

export class EventDisplay extends React.Component<EventProps, {}> {
  _timeout?: number;

  // Don't fire confirmation timeout if we skipped past it really fast
  componentWillUnmount() {
    if (typeof this._timeout !== "undefined") {
      clearTimeout(this._timeout);
    }
  }

  render() {
    let { event } = this.props;
    let past = moment(event.end).isBefore(new Date());

    // NB: Treat events as hidden only if some way to change that status
    let hidden = event.hidden === true && !!this.props.onHideChange;

    let title = event.title ?
      <span>{ event.title }</span> :
      <span className="no-title">{ EventText.NoTitle }</span>;

    return <div className={classNames("event", "panel", {
      unconfirmed: !!this.props.unconfirmed,
      hidden,
      past,
      "has-predictions": event.labels_predicted
    })} onClick={() => this.confirm(true)}>
      <div className="event-body">
        <h4>
          {
            this.props.onToggleSelect ?
            <CheckboxItem checked={this.props.selected} onChange={this.select}>
              <span className="sr-only">{ EventText.Select }</span>
            </CheckboxItem> : null
          } {
            this.props.eventHrefFn ?
            <a href={this.props.eventHrefFn(event)}>
              { title }
            </a> : title
          }
        </h4>

        { this.props.onHideChange ?
          <button className="hide-btn" onClick={() => this.toggleHide()}>
            { hidden ? CommonText.Show : CommonText.Hide }
          </button> : null }

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

          { event.location ? <span className="location">
            { event.location.length > 25 ?
              <span>{ event.location.slice(0, 22) }&hellip;</span> :
              event.location }
          </span> : null }

          { event.guests && event.guests.length ?
            <Tooltip
              target={<span className="guests">
                <Icon type="person" />
                { event.guests.length }
              </span>}
              title={EventText.attendeeMsgShort(
                _.map(event.guests, (g) => g.display_name || g.email)
              )}
            /> : null }

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

        { hidden || !this.props.labels || !this.props.onChange ? null :
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
        </div> }
      </div>

      { hidden ? null :
        <div className="event-primary-action">
          { this.props.onTimebombToggle ?
            <TimebombToggle
              loggedInUid={this.props.loggedInUid}
              event={event}
              onToggle={this.props.onTimebombToggle}
            /> : null }
        </div> }
    </div>;
  }

  select = (v: boolean) => {
    if (this.props.onToggleSelect) {
      this.props.onToggleSelect(this.props.event.id, v);
    }
  }

  confirm(explicit=false) {
    if (explicit && this.props.unconfirmed) {
      this.props.onExplicitConfirm(this.props.event.id);
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
    this.props.onHideChange &&
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

