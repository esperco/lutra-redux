import * as _ from "lodash";
import { ApiSvc } from "../lib/api";
import { GenericCalendar } from "../lib/apiT";
import {
  TeamCalendarState, TeamCalendarDataAction, TeamCalendarUpdateAction
} from "../states/team-cals";
import { ok } from "../states/data-status";

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

export function updateSelectedCalendars(teamId: string,
                                        selected: GenericCalendar[],
                                        deps: {
  dispatch: (a: TeamCalendarUpdateAction) => any;
  state: TeamCalendarState;
  Svcs: ApiSvc;
}) {
  let { dispatch, state, Svcs } = deps;
  let cals = state.teamCalendars[teamId];

  if (cals && ok(cals.selected)) {
    dispatch({
      type: "TEAM_CALENDAR_UPDATE",
      teamId, selected
    });
    let update = _.map(selected, (c) => c.id);

    Svcs.Api.putTeamTimestatsCalendars(teamId, update).then();
  }

  return Promise.resolve(undefined);
}
