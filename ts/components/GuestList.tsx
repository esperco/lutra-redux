/*
  Render a vertical list of guests for an event
*/

import * as classNames from "classnames";
import * as React from "react";
import * as ApiT from "../lib/apiT";
import * as Text from "../text/events";
import Tooltip from "./Tooltip";

export interface Props extends React.HTMLAttributes<HTMLDivElement> {
  event: ApiT.GenericCalendarEvent;
  hrefFn?: (x: ApiT.Attendee) => string;
}

export const GuestList = ({ className, event, hrefFn, ...props }: Props) => {
  let { guests } = event;
  if (!guests || !guests.length) return null;

  return <div className={classNames(className, "guest-list")}>
    <h4>{ Text.Attendees }</h4>
    { guests.map((guest, i) => <Guest
      key={guest.email || i}
      guest={guest}
      href={hrefFn ? hrefFn(guest) : undefined}
    />) }
  </div>;
}

export interface GuestProps {
  guest: ApiT.Attendee;
  href?: string;
}

export const Guest = ({ guest, href }: GuestProps) => {
  let display = guest.display_name || guest.email;
  return <div className={classNames("guest", {
    declined: guest.response === "Declined"
  })}>
    <Tooltip
      target={ href ?
        <a className="name" href={href}>
          { display }
        </a> :
        <span className="name">
          { display }
        </span> }
      title={guest.email}
    />
    <span className="status">
      { Text.attendeeStatus(guest.response) }
    </span>
  </div>;
}

export default GuestList;