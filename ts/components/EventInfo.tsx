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

export interface InlineOptProps extends BaseEventProps {
  event: ApiT.GenericCalendarEvent;
  inline?: boolean;
}

// Inline info about an event
export const InlineInfo = ({ event }: BaseEventProps) => {
  return <div className="event-info"><div className="inline-info">
    <Time event={event} inline={true} />
    <Location event={event} inline={true} />
    <GuestsSummary event={event} inline={false} />

    { event.merged && event.merged.cost ?
      <span className={"cost cost-" + event.merged.cost }>
        { _.repeat("$", event.merged.cost) }
      </span> : null }
  </div></div>;}
;


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
    { EventText.NoTitle }
  </span>;
  return p.href ? <a className="event-title" href={p.href}>
    { title }
  </a> : <span className="event-title">
    { title }
  </span>;
};

export const Time = ({ event, inline }: InlineOptProps) => {
  let timeSpan = <span><span className="start">
      { moment(event.start).format(inline ? "h:mm a" : "MMM D, h:mm a") }
    </span>{" to "}<span className="end">
      { moment(event.end).format("h:mm a") }
    </span></span>;

  let recurring = event.recurring_event_id ?
    <Tooltip
      target={<span className="recurring">
        <Icon type="repeat" />
      </span>}
      title={EventText.Recurring}
    /> : null;

  if (inline) {
    return <span className="time">
      { timeSpan } { recurring }
    </span>
  }

  return <div className="time">
    <Icon type="time">{ timeSpan }</Icon> { recurring }
  </div>;
};

export const Location = ({ event, inline }: InlineOptProps) => {
  let { location } = event;
  if (! location) return null;

  if (inline) {
    return <span className="location">
      { location.length > 25 ?
        <span>{ location.slice(0, 22) }&hellip;</span> :
        location }
    </span>;
  }

  return <div className="location">
    <Icon type="location">{ event.location }</Icon>
  </div>;
};

export const GuestsSummary = ({ event, inline }: InlineOptProps) => {
  let { guests } = event;
  guests = (event.guests || []).filter((g) => g.response !== "Declined");
  if (! guests.length) return null;

  let msg = EventText.attendeeMsgShort(
    guests.map((g) => g.display_name || g.email)
  );

  if (inline) {
    return <Tooltip
      target={<span className="guests">
        <Icon type="person" />
        { guests.length }
      </span>}
      title={msg}
    />;
  }

  return <div className="guests">
    <Icon type="person">{ msg }</Icon>
  </div>;
};

export const Description = ({ event }: BaseEventProps) => {
  return event.description ?
    <div className="description">
      { fmtText(event.description) }
    </div> : null;
};
