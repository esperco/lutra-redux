/*
  Single event editor
*/

require("less/components/_event-editor.less");
require("less/components/_event-info.less");
import * as _ from "lodash";
import * as React from "react";
import * as moment from "moment";
import * as classNames from "classnames";
import * as ApiT from "../lib/apiT";
import { LabelSet, useRecurringLabels } from "../lib/event-labels";
import fmtText from "../lib/fmt-text";
import * as CommonText from "../text/common";
import * as EventText from "../text/events";
import * as LabelText from "../text/labels";
import { ok, ready, StoreData } from "../states/data-status";
import { GroupMembers } from "../states/groups";
import Dropdown from "./Dropdown";
import Icon from "./Icon";
import LabelList from "./LabelList";
import Tooltip from "./Tooltip";

// Viewing event in editor will confirm its labels after this time in ms
const DEFAULT_AUTO_CONFIRM_TIMEOUT = 1500;

export interface Props {
  loggedInUid?: string;
  event: StoreData<ApiT.GenericCalendarEvent>|undefined;
  members: StoreData<GroupMembers>|undefined;
  labels: LabelSet;         // For LabelList
  searchLabels: LabelSet;   // For LabelList
  loginDetails: ApiT.LoginResponse|undefined;
  onChange: (x: ApiT.LabelInfo, active: boolean) => void;
  onForceInstance: () => void;
  onHide: (hidden: boolean) => void;
  onConfirm?: () => void;
  autoConfirmTimeout?: number;
  labelHrefFn?: (x: ApiT.LabelInfo) => string;
  guestHrefFn?: (x: ApiT.Attendee) => string;
}

export class EventEditor extends React.Component<Props, {}> {
  _timeout?: number;

  /* Tie auto-conf in event editor to component lifecycle */

  componentDidMount() {
    this.setConfirmTimeout();
  }

  componentDidUpdate(prevProps: Props) {
    if (prevProps.event !== this.props.event) {
      this.clearConfirmTimeout();
    }
    this.setConfirmTimeout();
  }

  componentWillUnmount() {
    this.clearConfirmTimeout();
  }

  // Once event has been viewed. Auto-confirm after a short timeout.
  setConfirmTimeout = () => {
    if (ready(this.props.event) &&
      typeof this._timeout === "undefined" &&
      this.props.autoConfirmTimeout !== Infinity &&
      !this.props.event.labels_confirmed)
    {
      this._timeout = setTimeout(this.confirm,
        this.props.autoConfirmTimeout || DEFAULT_AUTO_CONFIRM_TIMEOUT);
    }
  }

  clearConfirmTimeout = () => {
    if (typeof this._timeout !== "undefined") {
      clearTimeout(this._timeout);
      delete this._timeout;
    }
  }

  confirm = () => {
    this.props.onConfirm && this.props.onConfirm();
  }

  render() {
    if (! ok(this.props.event)) {
      return <div className="event-editor">
        <h3>{ EventText.NotFound }</h3>
      </div>;
    }

    if (this.props.event === "FETCHING") {
      return <div className="event-editor">
        <div className="placeholder" />
        <div className="placeholder" />
        <div className="placeholder" />
      </div>;
    }

    let event = this.props.event;
    let mStart = moment(event.start);
    let mEnd = moment(event.end);
    return <div className={classNames("event-editor", "event-info", {
      hidden: event.hidden
    })}>
      <Dropdown
        toggle={<button className="dropdown-toggle">
          <Icon type="options" />
        </button>}

        menu={<div className="dropdown-menu"><div className="menu">
          <button className="hide-btn"
                  onClick={() => this.props.onHide(!event.hidden)}>
            <span>{ event.hidden ? CommonText.Show : CommonText.Hide }</span>
            <div className="description">
              { event.hidden ?
                EventText.ShowDescription :
                EventText.HideDescription }
            </div>
          </button>
        </div></div>}
      />

      <h3 className="event-title">{ event.title ||
        <span className="no-title">{ EventText.NoTitle }</span>
      }</h3>

      <div className="time">
        <span className="start">
          { mStart.format("MMM D, LT") }
        </span>{" to "}<span className="end">
          { mStart.isSame(mEnd, 'day') ?
            mEnd.format("LT") : mEnd.format("LT") }
        </span>{" "}

        { event.recurring_event_id ?
          <Tooltip
            target={<span className="recurring">
              <Icon type="repeat" />
            </span>}
            title={EventText.Recurring}
          /> : null }
      </div>

      { event.location ?
        <div className="location">
          <Icon type="location" />
          {event.location}
        </div> : null }

      { event.description ?
        <div className="description">
          { fmtText(event.description) }
        </div> : null }

      <LabelList
        labels={this.props.labels}
        searchLabels={this.props.searchLabels}
        events={[event]}
        onChange={(ids, label, active) => this.props.onChange(label, active)}
        labelHrefFn={this.props.labelHrefFn}
      />

      { event.recurring_event_id ?
        <div className="recurring-labels alert info">
          { useRecurringLabels(event) ?
            <span>
              <span className="description">
                { LabelText.RecurringLabelsDescription }
              </span>
              <button onClick={this.props.onForceInstance}>
                { LabelText.SwitchToInstanceLabels }
              </button>
            </span> :
            LabelText.InstanceLabelsDescription }
        </div> : null }

      <GuestList guests={event.guests} hrefFn={this.props.guestHrefFn} />
    </div>
  }
}

export class GuestList extends React.Component<{
  guests?: ApiT.Attendee[]
  hrefFn?: (x: ApiT.Attendee) => string;
}, {}> {
  render() {
    if (_.isEmpty(this.props.guests)) {
      return null;
    }

    return <div className="guest-list panel">
      <h4>{ EventText.Attendees }</h4>
      { _.map(this.props.guests || [], (g, i) => this.renderGuest(g, i)) }
    </div>;
  }

  renderGuest(guest: ApiT.Attendee, index: number) {
    let display = guest.display_name || guest.email;
    return <div key={guest.email || index}
    className={classNames("guest", {
      declined: guest.response === "Declined"
    })}>
      <Tooltip
          target={this.props.hrefFn ?
            <a className="name" href={this.props.hrefFn(guest)}>
              { display }
            </a> :
            <span className="name">
              { display }
            </span>}
          title={guest.email}
      />
      <span className="status">
        { EventText.attendeeStatus(guest.response) }
      </span>
    </div>;
  }
}

export default EventEditor;
