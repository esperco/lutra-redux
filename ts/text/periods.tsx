import * as _ from "lodash";
import * as moment from "moment";
import { Interval, GenericPeriod, bounds } from "../lib/period";

// Period selector text
export const Day = `Day`;
export const Week = `Week`;
export const Month = `Month`;
export const Quarter = `Quarter`;
export const Custom = `Custom`;

export function date(d: Date|moment.Moment|string) {
  return moment(d).format("MMM D");
}

export function datePlusDay(d: Date|moment.Moment|string) {
  return moment(d).format("MMM D - dddd");
}

export function time(d: Date|moment.Moment|string) {
  return moment(d).format("h:mm a");
}

// Format a period as a single string
export function fmtPeriod(p: GenericPeriod, short=false) {
  let [start, end] = bounds(p);
  let startText = fmtPeriodDate(p.interval, start, short);
  if (p.start === p.end && p.interval !== 'day') {
    return startText;
  }
  let endText = fmtPeriodDate(p.interval, end, short);
  if (startText === endText) {
    return startText;
  }
  return `${startText} - ${endText}`;
}

function fmtPeriodDate(interval: Interval, d: Date, short=false) {
  let m = moment(d).startOf(interval);
  switch(interval) {
    case "quarter":
      return m.format(short ? "[Q]Q 'YY" : "[Q]Q YYYY");
    case "month":
      return m.format(short ? "MMM" : "MMMM YYYY");
    case "week":
      return m.format(short ? "MMM D" : "[Week of] MMM D");
    default:
      return date(d);
  }
}

// Format a period as a list of strings
export function fmtPeriodList(period: GenericPeriod, short=false) {
  let { interval, start, end } = period;
  let indices = _.range(start, end + 1);
  return _.map(indices,
    (i) => fmtPeriod({ interval, start: i, end: i }, short)
  );
}
