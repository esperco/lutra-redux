import * as _ from "lodash";
import * as PrefHandlers from "../handlers/team-prefs";
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
  let { Svcs, calIds } = _.last(q);
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
    // Auto-set Esper link if applicable
    let prefs = state.teamPreferences[props.teamId];
    if (ready(prefs) && typeof prefs.event_link === "undefined") {
      PrefHandlers.update(props.teamId, {
        event_link: true
      }, deps);
    }

    let selected = props.value ?
      _(cals.selected).concat([props.cal]).uniqBy((c) => c.id).value() :
      _.filter(cals.selected, (c) => c.id !== props.cal.id);
    dispatch({
      type: "TEAM_CALENDAR_UPDATE",
      teamId: props.teamId,
      selected
    });

    let update = _.map(selected, (c) => c.id);
    return TeamCalQueue.get(props.teamId).enqueue({
      teamId: props.teamId,
      calIds: update,
      Svcs
    });
  }

  return Promise.resolve(undefined);
}
