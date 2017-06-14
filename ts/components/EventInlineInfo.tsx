/*
  Displays some generic information about an event
*/
require("less/components/_event-info.less");
import * as _ from "lodash";
import * as moment from "moment";
import * as React from "react";
import * as ApiT from "../lib/apiT";
import Icon from "./Icon";
import Tooltip from "./Tooltip";
import * as EventText from "../text/events";

export interface Props {
  event: ApiT.GenericCalendarEvent;
  includeDay?: boolean;
}

export function EventInlineInfo({ event, includeDay }: Props) {
  return <div className="event-info"><div className="inline-info">
    <div className="time">
      <span className="start">
        { moment(event.start).format(includeDay ? "MMM D, h:mm a" : "h:mm a") }
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
          event.guests.map((g) => g.display_name || g.email)
        )}
      /> : null }

    { event.merged && event.merged.cost ?
      <span className={"cost cost-" + event.merged.cost }>
        { _.repeat("$", event.merged.cost) }
      </span> : null }
  </div></div>;
}

export default EventInlineInfo;