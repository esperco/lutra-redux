/*
  Components for displaying generic information about an Event
*/
require("less/components/_event-info.less");
import * as _ from "lodash";
import * as classNames from "classnames";
import * as moment from "moment";
import * as React from "react";
import * as ApiT from "../lib/apiT";
import fmtText from "../lib/fmt-text";
import Icon from "./Icon";
import Tooltip from "./Tooltip";
import * as EventText from "../text/events";

export interface BaseEventProps {
  event: ApiT.GenericCalendarEvent;
}

export interface InlineProps extends BaseEventProps {
  includeDay?: boolean;
}

export interface LocationProps extends BaseEventProps {
  event: ApiT.GenericCalendarEvent;
  inline?: boolean;
}

// Inline info about an event
export const InlineInfo = ({ event, includeDay }: InlineProps) => <div
  className="event-info"><div className="inline-info">
    <Time event={event} includeDay={includeDay} />
    <Location event={event} inline={true} />

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


/*
  Event box is a simple wrapper around displaying an event.
*/

export interface BoxProps extends React.HTMLAttributes<HTMLDivElement>{
  className?: string;
  event: ApiT.GenericCalendarEvent;
  children: React.ReactNode|React.ReactNode[];
}

export const Box = (p: BoxProps) => {
  let { className, event, children, ...divProps } = p;
  return <div className={classNames("event-info", "event-box", {
    past: moment(p.event.end).isBefore(new Date()),
  }, p.className)} {...divProps} >
    { p.children }
  </div>;
};


/*
  Render event details
*/

export interface TitleProps {
  event: ApiT.GenericCalendarEvent;
  href?: string;
}

export const Title = (p: TitleProps) => {
  let title = p.event.title || <span className="no-title">
    { EventText.NoTitle }>
  </span>;
  return p.href ? <a className="event-title" href={p.href}>
    { title }
  </a> : <span className="event-title">
    { title }
  </span>;
};

export const Time = ({ event, includeDay }: InlineProps) => {
  return <div className="time">
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
  </div>;
};

export const Location = ({ event, inline }: LocationProps) => {
  return event.location ? <div className="location">
    { inline ? null : <Icon type="location" /> }
    { inline && event.location.length > 25 ?
      <span>{ event.location.slice(0, 22) }&hellip;</span> :
      event.location }
  </div> : null;
};

export const Description = ({ event }: BaseEventProps) => {
  return event.description ?
    <div className="description">
      { fmtText(event.description) }
    </div> : null;
};
