import * as React from 'react';
import { roundStr } from '../lib/util';

export const NoTitle = "Untitled Event";
export const NoComment = "There are no comments for this event yet.";
export const NotFound = "Event Not Found";
export const Recurring = "Recurring Event";
export const FilterEvents = "Filter by Keyword";
export const CommentPlaceholder = "Post a comment about this event";
export const DefaultUsername = "Esper User";
export const HideDescription = "Remove all tags and exclude this event " +
  "from charts and stats.";
export const HideMultiDescription = "Remove all tags and exclude all " +
  "selected events from charts and stats."
export const ShowDescription = "This event is currently hidden from charts " +
  "and stats. Click to include it.";
export const ShowMultiDescription = "One or more of these events are " +
  "currently hidden from charts and stats. Click to include them.";

export const Attendees = "Guests";
export const Comments = "Comments";
export function attendeeStatus(
  status: "Needs_action"|"Declined"|"Tentative"|"Accepted"
) {
  switch(status) {
    case "Declined":
      return "Declined";
    case "Tentative":
      return "Tentative";
    case "Accepted":
      return "Accepted";
    default:
      return "No Response"
  }
}

export function attendeeMsgShort(attendees: string[]) {
  if (attendees.length === 0) { return ""; }
  if (attendees.length === 1) { return attendees[0]; }
  if (attendees.length === 2) {
    return `${attendees[0]} and ${attendees[1]}`;
  }
  return `${attendees[0]} and ${attendees.length - 1} others`;
}

/*
  Time stat durations are normally seconds. This normalizes to hours and
  rounds to nearest .05 hour -- rounding may be slightly off because of
  floating point arithmetic but that should be OK in most cases.
*/
export function toHours(seconds: number) {
  return Number((Math.round((seconds / 3600) / 0.05) * 0.05).toFixed(2));
}

export function fmtHours(hours: number, decimals=1): string {
  return roundStr(hours, decimals);
}

export function FmtHours({ hours, decimals } : {
  hours: number;
  decimals?: number;
}): JSX.Element {
  let [pre, post] = fmtHours(hours, decimals).split('.');
  return <span className="hours value">
    <span className="integer">{ pre }</span>
    { post ? <span className="decimal">
      {"." + post}
    </span> : null}
  </span>;
}

export function FmtHoursPct({ hours, decimals, pct } : {
  hours: number;
  decimals?: number;
  pct: number; // 0-1
}) {
  return <span className="hours-pct">
    <span>
      <FmtHours hours={hours} decimals={decimals} />
      <span className="unit">h</span>
    </span>
    <span>
      <span className="percent">{ roundStr(100 * pct, 0) }</span>
      <span className="unit">%</span>
    </span>
  </span>;
}

function s(n?: number) {
  return n != 1 ? 's' : '';
}

export function events(n?: number) {
  return `event${s(n)}`;
}

export function hours(n?: number) {
  return `hour${s(n)}`;
}

export function peopleHours(n?: number) {
  return `person hour${s(n)}`;
}

export function groupPeopleHours(n?: number) {
  return `team person hour${s(n)}`;
}

export function hiddenEventsMsg(n?: number) {
  return `${n} hidden ${events(n)}`;
}

export const HideHidden = "Don't show hidden events";

export function eventsSelected(n?: number) {
  return `${n} ${events(n)} selected`;
}

export const HiddenEventsDescription =
  "Some events have been marked as hidden. Click here to show them.";

export const CalcEventsDescription = "Total number of events";
export const CalcHoursDescription = "Aggregate duration of events";
export const CalcPeopleHoursDescription = "Total hours for each event times " +
  "each guest attending that event";
export const CalcGroupPeopleHoursDescription = "Total hours for each event " +
  "times each guest who is a member of this team attending that event";
export const PeopleHoursByLabelTitle = "Team Person Hours by Tag";

export const Refresh = "Refresh event data";
export const Select = "Select this event";
export const MoreEvents = "Load more events";