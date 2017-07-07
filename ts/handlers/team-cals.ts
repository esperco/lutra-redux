// import * as PrefHandlers from "../handlers/team-prefs";
import { uniqBy } from "lodash";
import { ApiSvc } from "../lib/api";
import { GenericCalendar } from "../lib/apiT";
import { QueueMap } from "../lib/queue";
import {
  TeamCalendarState, TeamCalendarDataAction, TeamCalendarUpdateAction
} from "../states/team-cals";
import {
  UpdateAction as TeamPreferencesUpdateAction,
  TeamPreferencesState
} from "../states/team-preferences";
import { ok, ready } from "../states/data-status";

export function fetchAvailableCalendars(teamId: string, deps: {
  dispatch: (a: TeamCalendarDataAction) => any,
  state: TeamCalendarState,
  Svcs: ApiSvc
}): Promise<void> {
  let { Svcs, state, dispatch } = deps;

  // Fetch if group doesn't exist
  let calendars = state.teamCalendars[teamId];

  if (!ok(calendars)) {
    dispatch({
      type: "TEAM_CALENDAR_DATA",
      dataType: "FETCH_START",
      fetchType: "available",
      teamId
    });

    return Svcs.Api.getGenericCalendarList(teamId)
      .then((availableCalendars) => {
        dispatch({
          type: "TEAM_CALENDAR_DATA",
          dataType: "FETCH_END",
          teamId,
          availableCalendars
        });
      });
  }
  return Promise.resolve(undefined);
}

export function fetchSelectedCalendars(teamId: string, deps: {
  dispatch: (a: TeamCalendarDataAction) => any,
  state: TeamCalendarState,
  Svcs: ApiSvc
}): Promise<void> {
  let { Svcs, state, dispatch } = deps;

  // Fetch if group doesn't exist
  let calendars = state.teamCalendars[teamId];

  if (!ok(calendars)) {
    dispatch({
      type: "TEAM_CALENDAR_DATA",
      dataType: "FETCH_START",
      fetchType: "selected",
      teamId
    });

    return Svcs.Api.getTimestatsCalendarList(teamId)
      .then((selectedCalendars) => {
        dispatch({
          type: "TEAM_CALENDAR_DATA",
          dataType: "FETCH_END",
          teamId,
          selectedCalendars
        });
      });
  }
  return Promise.resolve(undefined);
}


/* Update team calendars */

interface UpdateTeamCals {
  teamId: string;
  calIds: string[];
  Svcs: ApiSvc;
}

// Use last set of calendars in queue for each group
export const TeamCalQueue = new QueueMap<UpdateTeamCals>((teamId, q) => {
  let last = q[q.length - 1];
  if (! last) return Promise.resolve([]);
  let { Svcs, calIds } = last;
  return Svcs.Api.putTeamTimestatsCalendars(teamId, calIds).then(() => []);
});

export function toggleCalendar(props: {
  teamId: string;
  cal: GenericCalendar;
  value: boolean; // True => add, false => remove
}, deps: {
  dispatch: (a: TeamCalendarUpdateAction|TeamPreferencesUpdateAction) => any;
  state: TeamCalendarState & TeamPreferencesState;
  Svcs: ApiSvc;
}) {
  let { dispatch, state, Svcs } = deps;
  let cals = state.teamCalendars[props.teamId];
  if (cals && ready(cals.selected)) {
    let selected = props.value ?
      uniqBy(cals.selected.concat([props.cal]), (c) => c.id) :
      cals.selected.filter((c) => c.id !== props.cal.id);
    dispatch({
      type: "TEAM_CALENDAR_UPDATE",
      teamId: props.teamId,
      selected
    });

    let update = selected.map((c) => c.id);
    return TeamCalQueue.get(props.teamId).enqueue({
      teamId: props.teamId,
      calIds: update,
      Svcs
    });
  }

  return Promise.resolve(undefined);
}
