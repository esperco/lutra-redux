/*
  A worker task that calculates stuff
*/
import * as _ from "lodash";
import * as moment from "moment";
import * as ApiT from "../lib/apiT";
import { GenericPeriod, bounds } from "../lib/period";
import { QueryFilter } from "../lib/event-queries";
import iter from "../lib/event-query-iter";
import { CalcEndAction, CalcResults } from "../states/group-calcs";
import { EventsState } from "../states/group-events";

export interface QueryCalcTask {
  type: "GROUP_QUERY_CALC";
  groupId: string;
  query: QueryFilter;
  period: GenericPeriod;
};

// Handle task, return action maybe
export function handleGroupQueryCalc(
  task: QueryCalcTask,
  state: EventsState
): CalcEndAction|void {
  let results: CalcResults = {
    seconds: 0,
    eventCount: 0,
    peopleSeconds: 0,
  };

  let [startDate, endDate] = bounds(task.period);
  let startTime = startDate.getTime();
  let endTime = endDate.getTime();

  let complete = iter(task, state, (event) => {
    results.eventCount += 1;
    let seconds = getSeconds(event, {
      truncateStart: startTime,
      truncateEnd: endTime
    });
    results.seconds += seconds;
    results.peopleSeconds += (seconds * getNumGuests(event));
  });

  if (! complete) return;
  return {
    ...task,
    type: "GROUP_CALC_END",
    results
  };
}

export function getNumGuests(event: ApiT.GenericCalendarEvent) {
  return _.filter(event.guests,
    (g) => g.response !== "Declined"
  ).length;
}

export function getSeconds(event: ApiT.GenericCalendarEvent, opts: {
  truncateStart: number;
  truncateEnd: number;
}) {
  // Calculate duration
  let start = moment(event.start).valueOf();
  start = Math.max(opts.truncateStart, start);
  let end = moment(event.end).valueOf();
  end = Math.min(opts.truncateEnd, end);
  return Math.round((end - start) / 1000);
}