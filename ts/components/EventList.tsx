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
    return <EventDisplay key={ev.id} event={ev} />;
  }
}


interface EventProps {
  event: ApiT.GenericCalendarEvent;
}

export class EventDisplay extends React.Component<EventProps, {}> {
  shouldComponentUpdate(nextProps: EventProps) {
    return nextProps.event !== this.props.event;
  }

  render() {
    let { event } = this.props;
    return <div className="event panel">
      <h4>{
        event.title || <span className="no-title">{ EventText.NoTitle }</span>
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

