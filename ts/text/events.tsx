import * as React from 'react';
import { roundStr } from '../lib/util';

export const NoTitle = "Untitled Event";
export const NotFound = "Event Not Found";
export const Recurring = "Recurring Event";
export const FilterEvents = "Filter by Keyword";

export const Attendees = "Guests";
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