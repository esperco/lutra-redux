import * as _ from "lodash";
import * as React from "react";
import * as moment from "moment";
import * as classNames from "classnames";
import * as ApiT from "../lib/apiT";
import fmtText from "../lib/fmt-text";
import * as EventText from "../text/events";
import { ok, StoreData } from "../states/data-status";
import Icon from "./Icon";
import Tooltip from "./Tooltip";

interface Props {
  event: StoreData<ApiT.GenericCalendarEvent>|undefined;
}

export class EventEditor extends React.Component<Props, {}> {
  render() {
    let event = this.props.event;
    if (! ok(event)) {
      return <div className="event-editor">
        <h3>{ EventText.NotFound }</h3>
      </div>;
    }

    if (event === "FETCHING") {
      return <div className="event-editor">
        <div className="placeholder" />
        <div className="placeholder" />
        <div className="placeholder" />
      </div>;
    }

    return <div className="event-editor">
      <h3>{ event.title ||
        <span className="no-title">{ EventText.NoTitle }</span>
      }</h3>

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

      { event.location ?
        <div className="location">
          <Icon type="location" />
          {event.location}
        </div> : null }

      { event.description ?
        <div className="description">
          { fmtText(event.description) }
        </div> : null }

      <GuestList guests={event.guests} />
    </div>
  }
}

export class GuestList extends React.Component<{
  guests?: ApiT.Attendee[]
}, {}> {
  render() {
    if (_.isEmpty(this.props.guests)) {
      return null;
    }

    return <div className="guest-list">
      <h4>{ EventText.Attendees }</h4>
      { _.map(this.props.guests || [], (g, i) => this.renderGuest(g, i)) }
    </div>;
  }

  renderGuest(guest: ApiT.Attendee, index: number) {
    return <div key={guest.email || index}
    className={classNames("guest", {
      declined: guest.response === "Declined"
    })}>
      <Tooltip
          target={<span className="name">
            { guest.display_name || guest.email }
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