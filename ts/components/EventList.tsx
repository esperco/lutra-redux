/*
  A simple list of events
*/
import * as _ from "lodash";
import * as moment from "moment";
import * as React from "react";
import * as ApiT from "../lib/apiT";
import Icon from "./Icon";
import LabelList from "./LabelList";
import Tooltip from "./Tooltip";
import Waypoint from "./Waypoint";
import * as classNames from "classnames";
import { LabelSet } from "../lib/event-labels";
import { ok, StoreData } from "../states/data-status";
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
  autoConfirmTimeout?: number;
}

export interface ListProps extends SharedProps {
  events: (StoreData<ApiT.GenericCalendarEvent>|undefined)[];
}

export class EventList extends React.Component<ListProps, {}> {
  render() {
    return <div className="event-list panel">
      { _.map(this.props.events, (ev, i) => this.renderEvent(ev, i)) }
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
    return <EventDisplay key={ev.id} event={ev}
      { ...this.props }
    />;
  }
}


export interface EventProps extends SharedProps {
  event: ApiT.GenericCalendarEvent;
}

interface EventState {
  // Track confirmation in state because we want to persist indications
  // of confirmation even after auto-confirming
  confirmed: boolean;
}

export class EventDisplay extends React.Component<EventProps, EventState> {
  _timeout: number;

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
    clearTimeout(this._timeout);
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
      <h4>{ this.props.eventHrefFn ?
        <a href={this.props.eventHrefFn(event)}
           onClick={() => this.confirm(true)}>
          { title }
        </a> : title
      }</h4>

      <button className="hide-btn" onClick={() => this.toggleHide()}>
        { event.hidden ? CommonText.Show : CommonText.Hide }
      </button>

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

      { event.guests && event.guests.length ? <div className="guests">
        { event.merged && event.merged.cost ?
          <span className={"cost cost-" + event.merged.cost }>
            { _.repeat("$", event.merged.cost) }
          </span> : null }

        { EventText.attendeeMsgShort(
          _.map(event.guests, (g) => g.display_name || g.email)
        ) }
      </div> : null }

      { !event.labels_confirmed ?
        <span className="confirm-waypoint">
          <Waypoint onEnter={this.setConfirmTimeout} />
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
    </div>;
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
    if (!this._timeout && this.props.autoConfirmTimeout !== Infinity) {
      this._timeout = setTimeout(() => this.confirm(false),
        this.props.autoConfirmTimeout || DEFAULT_AUTO_CONFIRM_TIMEOUT);
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

