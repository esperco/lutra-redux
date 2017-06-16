/*
  Basic interface for processing a list of events
*/

require("less/components/_event-info.less");
import * as React from "react";
import * as ApiT from "../lib/apiT";
import EventPlaceholder from "./EventPlaceholder";
import { EventDataList } from "./QueryDay";
import { ready } from "../states/data-status";

export interface Props {
  className?: string;
  events: EventDataList;
  cb: (e: ApiT.GenericCalendarEvent) => React.ReactNode;
}

/*
  Helper function for iterating over a list of events. Renders placeholder
  if FETCHING, otherwise discards invalid event state.
*/
export function mapEvents({ events, cb }: Props): React.ReactNode[] {
  let ret: React.ReactNode[] = [];
  events.forEach((e, i) => {
    if (ready(e)) {
      ret.push(cb(e));
    }
    else if (e === "FETCHING") {
      ret.push(<EventPlaceholder key={i} />);
    }
  });
  return ret;
}

/*
  Component is actally just simple wrapper around mapEvents. Can
  extend by importing mapEvents rather than extending actual component.
*/
export const EventList =
  ({ className, events, cb }: Props) => <div className={className}>
    { mapEvents({ events, cb }) }
  </div>;

export default EventList;