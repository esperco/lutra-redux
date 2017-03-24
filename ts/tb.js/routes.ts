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

export interface EventsRoute {
  page: "Events";
  period: GenericPeriod;
  teamId: string;
};

export const events = Paths.events.route<Deps>(function(p, deps) {
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
      page: "Events",
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
    deps.Svcs.Nav.go(Paths.calSetup.href({}));
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
  if (! team) return;

  // Two sources of calendar info -> teamCalendars has priority
  let cals = deps.state.teamCalendars[team.teamid];
  let hasCals = cals && ready(cals.selected) ?
    !!cals.selected.length :
    team.team_timestats_calendars && !!team.team_timestats_calendars.length;
  if (hasCals) return team;

  // No cals, go to onboarding
  deps.Svcs.Nav.go(Paths.calSetup.href({}));
  return;
}


/*
  Pick event setup route --> onboarding step where we ask user to pick an
  event to enable timebomb for
*/

export interface PickEventSetupRoute {
  page: "PickEventSetup";
  teamId: string;
  period: GenericPeriod;
}

export const pickEventSetup = Paths.pickEventSetup.route<Deps>(
function(p, deps) {
  let team = checkForCalendar(deps);
  if (! team) return;
  let teamId = team.teamid;

  /*
    Default period = 2 days from now + 6 days -- start 2 days from now
    because that's the earliest we can set a time bomb.
  */
  let period = p.period || fromDates(
    moment(new Date()).add(2, 'days').toDate(),
    moment(new Date()).add(8, 'days').toDate()
  );

  // Fetch events
  Events.fetchEvents({
    calgroupId: team.teamid,
    calgroupType: "team",
    period, query: {}
  }, deps);

  deps.dispatch({
    type: "ROUTE",
    route: {
      page: "PickEventSetup",
      teamId, period
    }
  });
});


/*
  Event detail route -- after user picks an event during onboarding, we
  provide additional info about how Timebomb works
*/

export interface EventDetailsSetupRoute {
  page: "EventDetailsSetup",
  teamId: string;
  eventId: string;
  period?: GenericPeriod;
}

export const eventDetailSetup = Paths.eventDetailsSetup.route<Deps>(
function(p, deps) {
  let team = checkForCalendar(deps);
  if (! team) return;
  let teamId = team.teamid;
  let { eventId, period } = p;

  /*
    Make sure we have event details (should have already been fetched earlier,
    but check again just in case).
  */
  Events.fetchById({
    calgroupId: teamId,
    calgroupType: "team",
    eventId
  }, deps);

  // Default timebomb on?
  TeamPrefs.fetch(teamId, deps);

  deps.dispatch({
    type: "ROUTE",
    route: {
      page: "EventDetailsSetup",
      teamId,
      eventId,
      period
    }
  });
});


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
  EventsRoute|
  CalSetupRoute|
  PickEventSetupRoute|
  EventDetailsSetupRoute|
  SettingsRoute;

export function init({ dispatch, getState, Svcs, Conf }: {
  dispatch: (action: Action) => any,
  getState: () => State,
  Svcs: AnalyticsSvc & ApiSvc & Routing.NavSvc,
  Conf: { cacheDuration?: number; maxDaysFetch?: number; }
}) {
  Routing.init<Deps>(
    [ // Routes
      events,
      setup,
      calSetup,
      pickEventSetup,
      eventDetailSetup,
      settings
    ],

    // Deps
    () => ({ dispatch, state: getState(), Svcs, Conf }),

    // Opts
    { home: () => Paths.events.href({}) }
  );
}
