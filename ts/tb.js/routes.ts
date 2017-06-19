import * as moment from "moment";
import * as Paths from "./paths";
import { Action, State } from "./types";
import * as OnboardingFlag from "./onboarding-flag";
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
  Conf: { cacheDuration?: number; maxDaysFetch?: number; }
}


/* EventList is our main route */

export interface EventsRoute {
  page: "Events";
  period: GenericPeriod;
  teamId: string;
  onboarding: boolean; // Show onboarding helper msg for new user
                       // Automatically set defaults if necessary.
  eventId?: string;    // Selected event
};

export interface RedirectRoute {
  page: "Redirect";
}

export const events = Paths.events.route<Deps>(async function(p, deps) {
  let team = checkForCalendar(deps);
  if (! team) return;
  let teamId = team.teamid;
  let eventId = p.eventId;
  let onboarding = !!p.onboarding;

  // Onboarding mode -> auto set defaults
  if (onboarding) {

    // Render redirect while waiting for timebomb settings to finish
    deps.dispatch({ type: "ROUTE", route: { page: "Redirect" }});
    await TeamPrefs.autosetTimebomb(teamId, deps);

    // Clear flag since, if we get here, we've "cleared" onboarding
    OnboardingFlag.unset(deps.Svcs);
  }

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
      period, teamId, eventId,
      onboarding
    }
  });
});


/*
  Call setup to create a team. Not an actual route.
  Redirects to cal setup.
*/

export const setup = Paths.setup.route<Deps>(async function(p, deps) {
  await Teams.ensureSelfExecTeam(deps);
  deps.Svcs.Nav.go(Paths.calSetup.href({}));

  // We're in onboarding mode if we get here. Set flag!
  OnboardingFlag.set(deps.Svcs);
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
  eventId?: string;
}

export const pickEventSetup = Paths.pickEventSetup.route<Deps>(
function(p, deps) {
  let team = checkForCalendar(deps);
  if (! team) return;
  let teamId = team.teamid;

  /*
    Default period = 1 days from now + 6 days -- start 1 day from now
    because that's the earliest we can set a time bomb.
  */
  let period = p.period || fromDates(
    moment(new Date()).add(1, 'days').toDate(),
    moment(new Date()).add(7, 'days').toDate()
  );

  // Show modal explaining what just happened
  let eventId = p.eventId;

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
      teamId, period, eventId
    }
  });
});


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
  PickEventSetupRoute|
  SlackSetupRoute;

export function init({ dispatch, getState, Svcs, Conf }: {
  dispatch: (action: Action) => any,
  getState: () => State,
  Svcs: AnalyticsSvc & ApiSvc & Routing.NavSvc & LocalStoreSvc,
  Conf: { cacheDuration?: number; maxDaysFetch?: number; }
}) {
  let onboarding = OnboardingFlag.get(Svcs);
  Routing.init<Deps>(
    [ // Routes
      events,
      setup,
      calSetup,
      pickEventSetup,
      slackSetup
    ],

    // Deps
    () => ({ dispatch, state: getState(), Svcs, Conf }),

    /*
      Opts - set onboarding flag if local storage tells us do (this lets us
      re-initiate onboarding even if user was logged out or redirected via
      Oauth to, e.g., Slack)
    */
    { home: () => Paths.events.href({ onboarding }) }
  );
}
