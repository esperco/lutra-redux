/*
  A worker task that calculates stuff
*/
import * as _ from "lodash";
import * as moment from "moment";
import * as ApiT from "../lib/apiT";
import { GenericPeriod, toDays, bounds } from "../lib/period";
import { QueryFilter, stringify } from "../lib/event-queries";
import { ready } from "../states/data-status";
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
  let results = runCalc(task, state);
  if (! results) return;
  return {
    ...task,
    type: "GROUP_CALC_END",
    results
  };
}


/* Actual Calcuation */
export function runCalc(
  task: QueryCalcTask,
  state: EventsState
): CalcResults|void {
  let ret: CalcResults = {
    seconds: 0,
    eventCount: 0,
    peopleSeconds: 0,
  };

  let [startDate, endDate] = bounds(task.period);
  let startTime = startDate.getTime();
  let endTime = endDate.getTime();
  let eventMap: Record<string, true> = {}; // Have we seen this event before?

  /*
    Iterate through each event for each day in query -- breaks and returns
    null if data isn't ready yet
  */
  let queryDays = state.groupEventQueries[task.groupId] || [];
  let { start: startDay, end: endDay} = toDays(task.period);
  let key = stringify(task.query);
  for (let i = startDay; i <= endDay; i++) {
    let queryResults = (queryDays[i] || {})[key];
    if (! ready(queryResults)) return;

    for (let j in queryResults.eventIds) {
      let id = queryResults.eventIds[j];
      let event = (state.groupEvents[task.groupId] || {})[id];
      if (! ready(event)) return;

      // Don't process same event twice
      if (! eventMap[event.id]) {
        eventMap[event.id] = true;
        if (event.hidden) { continue; }

        ret.eventCount += 1;
        let seconds = getSeconds(event, {
          truncateStart: startTime,
          truncateEnd: endTime
        });
        ret.seconds += seconds;
        ret.peopleSeconds += (seconds * getNumGuests(event));
      }
    }
  }
  return ret;
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