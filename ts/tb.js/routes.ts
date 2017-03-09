import * as moment from "moment";
import * as Paths from "./paths";
import * as Routing from "../lib/routing";
import { Action, State } from "./types";
import { AnalyticsSvc } from "../lib/analytics";
import { ApiSvc } from "../lib/api";
import * as ApiT from "../lib/apiT";
import { GenericPeriod, fromDates } from "../lib/period";
import * as Events from "../handlers/events";
import * as Teams from "../handlers/teams";
import * as TeamCals from "../handlers/team-cals";
import * as TeamPrefs from "../handlers/team-prefs";
import { ready } from "../states/data-status";

interface Deps {
  dispatch: (action: Action) => any,
  state: State,
  Svcs: AnalyticsSvc & ApiSvc & Routing.NavSvc,
  Conf: { cacheDuration?: number; maxDaysFetch?: number; }
}


/* EventList is our main route */

export interface EventListRoute {
  page: "EventList";
  period: GenericPeriod;
  teamId: string;
};

export const eventList = Paths.eventList.route<Deps>(function(p, deps) {
  let team = checkForCalendar(deps);
  if (! team) return;
  let teamId = team.teamid;

  // Default period = today + 6 (7 days total)
  let period = p.period || fromDates(
    new Date(),
    moment(new Date()).add(6, 'days').toDate()
  );

  // Fetch events
  Events.fetchEvents({
    calgroupId: team.teamid,
    calgroupType: "team",
    period, query: {}
  }, deps);

  // Dispatch route changes
  deps.dispatch({
    type: "ROUTE",
    route: {
      page: "EventList",
      period, teamId
    }
  });
});


/*
  Call setup to create a team. Not an actual route.
  Redirects to settings?onboarding=1
*/

export const setup = Paths.setup.route<Deps>(function(p, deps) {
  Teams.ensureSelfExecTeam(deps).then((team) => {
    deps.Svcs.Nav.go(Paths.settings.href({ onboarding: true }));
  });
});

// Function that redirects to setup if no team found
export const checkForTeam = function(deps: Deps): ApiT.Team|undefined {
  let team = Teams.getSelfExecTeam(deps);
  if (team) return team;
  deps.Svcs.Nav.go(Paths.setup.href({}));
  return;
}


/*
  Calendar setup page
*/

export interface CalSetupRoute {
  page: "CalSetup";
  teamId: string;
}

export const calSetup = Paths.calSetup.route<Deps>(function(p, deps) {
  let team = checkForTeam(deps);
  if (! team) return;
  let teamId = team.teamid;

  // Fetch info for user's team
  TeamCals.fetchAvailableCalendars(teamId, deps);
  TeamCals.fetchSelectedCalendars(teamId, deps);
  TeamPrefs.fetch(teamId, deps);

  deps.dispatch({
    type: "ROUTE",
    route: {
      page: "CalSetup",
      teamId
    }
  });
});


// Function that redirects to settings if no calendars found
export const checkForCalendar = function(deps: Deps): ApiT.Team|undefined {
  let team = checkForTeam(deps);
  if (team) {
    // Two sources of calendar info -> teamcalendars has priority
    let cals = deps.state.teamCalendars[team.teamid];
    let hasCals = cals && ready(cals.selected) ?
      !!cals.selected.length :
      team.team_timestats_calendars && !!team.team_timestats_calendars.length;
    if (hasCals) return team;
  }

  // No cals, go to onboarding
  deps.Svcs.Nav.go(Paths.calSetup.href({}));
  return;
}


/*
  Settings is both one of our onboarding screens and place to actually
  change settings for stuff.
*/

export interface SettingsRoute {
  page: "Settings";
  teamId: string;
}

export const settings = Paths.settings.route<Deps>(function(p, deps) {
  let team = checkForTeam(deps);
  if (! team) return;
  let teamId = team.teamid;

  // Fetch info for user's team
  TeamCals.fetchAvailableCalendars(team.teamid, deps);
  TeamCals.fetchSelectedCalendars(team.teamid, deps);
  TeamPrefs.fetch(team.teamid, deps);

  deps.dispatch({
    type: "ROUTE",
    route: {
      page: "Settings",
      teamId
    }
  });
});

export type RouteTypes =
  EventListRoute|
  CalSetupRoute|
  SettingsRoute;

export function init({ dispatch, getState, Svcs, Conf }: {
  dispatch: (action: Action) => any,
  getState: () => State,
  Svcs: AnalyticsSvc & ApiSvc & Routing.NavSvc,
  Conf: { cacheDuration?: number; maxDaysFetch?: number; }
}) {
  Routing.init<Deps>(
    [ // Routes
      eventList,
      setup,
      calSetup,
      settings
    ],

    // Deps
    () => ({ dispatch, state: getState(), Svcs, Conf }),

    // Opts
    { home: () => Paths.eventList.href({}) }
  );
}
