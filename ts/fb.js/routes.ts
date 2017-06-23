import * as moment from "moment";
import * as Paths from "./paths";
import { Action, State } from "./types";
import { AnalyticsSvc } from "../lib/analytics";
import { ApiSvc } from "../lib/api";
import * as ApiT from "../lib/apiT";
import { GenericPeriod, fromDates } from "../lib/period";
import { LocalStoreSvc } from "../lib/local-store";
import * as Routing from "../lib/routing";
import * as Events from "../handlers/events";
import * as Teams from "../handlers/teams";
import * as TeamCals from "../handlers/team-cals";
import * as TeamPrefs from "../handlers/team-prefs";
import { ready } from "../states/data-status";

interface Deps {
  dispatch: (action: Action) => any,
  state: State,
  Svcs: AnalyticsSvc & ApiSvc & Routing.NavSvc & LocalStoreSvc,
  Conf: {
    cacheDuration?: number;
    maxDaysFetch?: number;
  }
}


/* EventList is our main route */

export interface EventsRoute {
  page: "Events";
  period: GenericPeriod;
  teamId: string;
  eventId?: string;    // Selected event
};

export interface RedirectRoute {
  page: "Redirect";
}

export const events = Paths.events.route<Deps>((p, deps) => {
  let team = checkForFlag(deps);
  if (! team) return;
  let teamId = team.teamid;
  let eventId = p.eventId;

  // Default period = today + 6 (7 days total)
  let start = moment(new Date());
  let period = p.period || fromDates(
    start.toDate(),
    start.clone().add(6, 'days').toDate()
  );

  // Fetch prefs + events
  TeamPrefs.fetch(teamId, deps);
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
      period, teamId, eventId
    }
  });
});


/*
  Call setup to create a team. Not an actual route.
  Redirects to cal setup.
*/

export const setup = Paths.setup.route<Deps>(async function(p, deps) {
  deps.dispatch({ type: "ROUTE", route: { page: "Redirect" }});
  await Teams.ensureSelfExecTeam(deps);
  deps.Svcs.Nav.go(Paths.calSetup.href({}));
});

// Function that redirects to setup if no team found
export const checkForTeam = function(deps: Deps): ApiT.Team|undefined {
  let team = Teams.getSelfExecTeam(deps);
  if (team) return team;
  deps.Svcs.Nav.go(Paths.setup.href({}));
  return; // Return undefined to signal wait for redirect
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
  if (! team) return; // Wait for redirect

  // Two sources of calendar info -> teamCalendars has priority
  let cals = deps.state.teamCalendars[team.teamid];
  let hasCals = cals && ready(cals.selected) ?
    !!cals.selected.length :
    team.team_timestats_calendars && !!team.team_timestats_calendars.length;
  if (hasCals) return team;

  // No cals, go to onboarding
  deps.Svcs.Nav.go(Paths.calSetup.href({}));
  return; // Return undefined to signal wait for redirect
}


/*
  Auto-enables feedback if necessary and sets feature flag. Not a real page.
  Redirects to event list when done.

  TODO: Redirect to welcome page.
*/

export const activate = Paths.activate.route<Deps>(
  async (p, deps) => {
    let team = checkForCalendar(deps);
    if (! team) return; // Wait for redirect
    let teamId = team.teamid;

    // Render redirect while waiting for feedback settings to finish
    deps.dispatch({ type: "ROUTE", route: { page: "Redirect" }});
    await TeamPrefs.autosetFeedback(teamId, deps);

    // Done, go to events
    deps.Svcs.Nav.go(Paths.events.href({}));
  });

// Function that redirects to activation if feature flag isn't found
export const checkForFlag = function(deps: Deps): ApiT.Team|undefined {
  let team = checkForCalendar(deps);
  if (! team) return; // Wait for redirect

  if (deps.state.login && deps.state.login.feature_flags.fb) {
    return team;
  }

  // Flag unset, activate
  deps.Svcs.Nav.go(Paths.activate.href({}));
  return; // Return undefined to signal wait for redirect
};


/*
  Setup page requesting Slack auth
*/

export interface SlackSetupRoute {
  page: "SlackSetup";
  teamId: string;
}

export const slackSetup = Paths.slackSetup.route<Deps>(function(p, deps) {
  let team = checkForCalendar(deps);
  if (! team) return;
  let teamId = team.teamid;

  deps.dispatch({
    type: "ROUTE",
    route: {
      page: "SlackSetup",
      teamId
    }
  });
});

export type RouteTypes =
  EventsRoute|
  RedirectRoute|
  CalSetupRoute|
  SlackSetupRoute;

export function init({ dispatch, getState, Svcs, Conf }: {
  dispatch: (action: Action) => any,
  getState: () => State,
  Svcs: AnalyticsSvc & ApiSvc & Routing.NavSvc & LocalStoreSvc,
  Conf: { cacheDuration?: number; maxDaysFetch?: number; }
}) {
  Routing.init<Deps>(
    [ // Routes
      events,
      setup,
      calSetup,
      activate,
      slackSetup
    ],

    // Deps
    () => ({ dispatch, state: getState(), Svcs, Conf }),

    // Homepage
    { home: () => Paths.events.href({}) }
  );
}
