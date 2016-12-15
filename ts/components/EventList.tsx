/*
  A simple list of events
*/
import * as _ from "lodash";
import * as moment from "moment";
import * as React from "react";
import * as ApiT from "../lib/apiT";
import Icon from "../components/Icon";
import Tooltip from "../components/Tooltip";
// import * as classNames from "classnames";
import { ok, StoreData } from "../states/data-status";
import * as EventText from "../text/events";

interface ListProps {
  events: (StoreData<ApiT.GenericCalendarEvent>|undefined)[];
  eventHrefFn ?: (ev: ApiT.GenericCalendarEvent) => string;
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
    return <EventDisplay key={ev.id}
      event={ev}
      eventHref={this.props.eventHrefFn && this.props.eventHrefFn(ev)}
    />;
  }
}


interface EventProps {
  event: ApiT.GenericCalendarEvent;
  eventHref?: string;
}

export class EventDisplay extends React.Component<EventProps, {}> {
  shouldComponentUpdate(nextProps: EventProps) {
    return nextProps.event !== this.props.event;
  }

  render() {
    let { event } = this.props;
    let title = event.title ?
      <span>{ event.title }</span> :
      <span className="no-title">{ EventText.NoTitle }</span>;

    return <div className="event panel">
      <h4>{ this.props.eventHref ?
        <a href={this.props.eventHref}>{ title }</a> :
        title
      }</h4>

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
        { EventText.attendeeMsgShort(
          _.map(event.guests, (g) => g.display_name || g.email)
        ) }
      </div> : null }
    </div>;
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

