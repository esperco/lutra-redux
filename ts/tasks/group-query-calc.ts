/*
  A worker task that calculates stuff
*/
import * as _ from "lodash";
import * as moment from "moment";
import * as ApiT from "../lib/apiT";
import { GenericPeriod, bounds } from "../lib/period";
import { GuestSet, guestSetFromGroupMembers } from "../lib/event-guests";
import { QueryFilter } from "../lib/event-queries";
import iter from "../lib/event-query-iter";
import { CalcEndAction, CalcResults } from "../states/group-calcs";
import { ready } from "../states/data-status";
import { GroupState } from "../states/groups";
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
  state: EventsState & GroupState
): CalcEndAction|void {
  let results: CalcResults = {
    seconds: 0,
    eventCount: 0,
    peopleSeconds: 0,
    groupPeopleSeconds: 0,
    labelResults: {},
    unlabeledResult: {
      seconds: 0,
      eventCount: 0,
      peopleSeconds: 0,
      groupPeopleSeconds: 0,
    }
  };

  let [startDate, endDate] = bounds(task.period);
  let startTime = startDate.getTime();
  let endTime = endDate.getTime();

  let members = state.groupMembers[task.groupId];
  let guestSet = ready(members) ?
    guestSetFromGroupMembers(members, false) : // False -> exclude GIMs
    new GuestSet([]);

  let complete = iter(task, state, (event) => {
    let seconds = getSeconds(event, {
      truncateStart: startTime,
      truncateEnd: endTime
    });
    let guests = filterGuests(event);
    let groupGuests = filterGroupGuests(guests, guestSet);

    let incr = (r: typeof results.unlabeledResult) => {
      r.eventCount += 1;
      r.seconds += seconds;
      r.peopleSeconds += (seconds * guests.length);
      r.groupPeopleSeconds += (seconds * groupGuests.length);
    };
    incr(results);

    // Segment results by label
    _.each(event.labels || [], (l) => {
      let labelResults = results.labelResults[l.normalized] =
        results.labelResults[l.normalized] || {
          eventCount: 0,
          seconds: 0,
          peopleSeconds: 0,
          groupPeopleSeconds: 0
        };
      incr(labelResults);
    });

    if (_.isEmpty(event.labels)) {
      incr(results.unlabeledResult);
    }
  });

  if (! complete) return;
  return {
    ...task,
    type: "GROUP_CALC_END",
    results
  };
}

// Exclude declined guests
export function filterGuests(event: ApiT.GenericCalendarEvent) {
  return _.filter(event.guests,
    (g) => g.response !== "Declined"
  );
}

// Filter guests that are in group
export function filterGroupGuests(
  guests: ApiT.Attendee[],
  groupMembers: GuestSet
) {
  return _.filter(guests, (g) => groupMembers.has(g));
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