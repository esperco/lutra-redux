/*
  Helpers for representing a period of time as an absolute integer
*/
import * as _ from "lodash";
import * as moment from "moment";
import { ParamType, NumberArrayParam } from "./routing";

export type Interval = 'day'|'week'|'month'|'quarter';
export interface Period {
  interval: Interval;
  start: number;
  end: number; // For optional period ranges -- if not provided, this
               // should equal start
}

/*
  The "0" period for each interval is the period which contains the epoch.
  Note that we're currently using *local* time for thinking about intervals.
*/
export const Epoch = new Date(1970, 0, 1);

export function index(date: Date, interval: Interval) {
  let epochForInterval = moment(Epoch).startOf(interval);
  return moment(date).diff(epochForInterval, interval);
}

export function fromDates(start: Date, end: Date): Period;
export function fromDates(interval: Interval, start: Date, end: Date): Period;
export function fromDates(...args: any[]): Period
{
  let [interval, start, end] =
    args.length === 3 ? args :
    [guessInterval(args[0], args[1]), args[0], args[1]];
  return {
    interval: interval,
    start: index(start, interval),
    end: index(end, interval)
  }
}

// Step downwards from highest specifity to least to guess interval
export function guessInterval(start: Date, end: Date): Interval {
  let intervals: Interval[] = ['quarter', 'month', 'week'];
  for (let i in intervals) {
    let interval = intervals[i];
    if (moment(end).clone().startOf(interval).isSame(start, 'day') &&
        moment(start).clone().endOf(interval).isSame(end, 'day')) {
      return interval;
    }
  }
  return 'day';
}

export function bounds({interval, start, end}: Period): [Date, Date] {
  let epochForInterval = moment(Epoch).startOf(interval);
  return [
    epochForInterval.clone().add(start, interval).toDate(),
    epochForInterval.clone().add(end, interval).endOf(interval).toDate()
  ];
}

export function now(interval: Interval) {
  let d = new Date();
  return fromDates(interval, d, d);
}

// Increment period range -- keeps same difference between start and end
export function add(p: Period, i: number): Period {
  let diff = p.end - p.start;
  let start = p.start + (diff + 1) * i;
  let end = start + diff;
  return { interval: p.interval, start, end };
}

// Get a list of dates from start / end dates
export function datesFromBounds(start: Date, end: Date) {
  var startM = moment(start).startOf('day');
  var endM = moment(end).endOf('day');
  var ret: Date[] = [];
  while (endM.diff(startM) > 0) {
    ret.push(startM.clone().toDate());
    startM = startM.add(1, 'day');
  }
  return ret;
}

// Converts single period to range version (adds some intervals)
export function toRange(period: Period, maxDate?: Date): Period {
  if (period.interval === "day") { // No day ranges allowed, make week
    let [start, end] = bounds(period);
    period = fromDates("week", start, end);
  } else {
    period = _.clone(period);
  }

  if (period.start === period.end) {
    switch (period.interval) {
      case "quarter":
        period.end += 1;
        break;
      case "month":
        period.end += 2;
        break;
      default: // Week
        period.end += 4;
        break;
    }

    // Don't go past max
    if (maxDate) {
      let end = bounds(period)[1];
      if (end.getTime() > maxDate.getTime()) {
        period.end = fromDates(period.interval,
          maxDate, maxDate
        ).end;
      }
    }
  }

  return period;
}

// Converts range period to single version (just uses the first interval)
export function toSingle(period: Period): Period {
  // Day period -> treat as "custom"
  if (period.interval === 'day') {
    return period;
  }

  return {
    interval: period.interval,
    start: period.start,
    end: period.start
  };
}


/* Routing Helpers */

const PeriodSeparator = ",";
export const PeriodParam: ParamType<Period> = {
  clean(val?: string): Period|null {
    if (val) {
      let parts = val.split(PeriodSeparator);
      let interval = cleanInterval(parts[0]);
      let indices = NumberArrayParam.clean(
        parts.slice(1).join(PeriodSeparator));
      if (interval && indices && indices.length === 2) {
        let [start, end] = indices;
        if (typeof end === "number" && !isNaN(end) &&
            typeof start === "number" && !isNaN(start) &&
            end >= start) {
          return { interval, start, end };
        }
      }
    }
    return null;
  },

  toStr(period: Period): string {
    return [
      period.interval[0], period.start.toString(), period.end.toString()
    ].join(PeriodSeparator);
  }
};

function cleanInterval(val: string): Interval|null {
  if (val) {
    switch (val[0].toLowerCase()) {
      case "q":
        return "quarter";
      case "m":
        return "month";
      case "w":
        return "week";
      case "d":
        return "day";
    }
  }
  return null;
}