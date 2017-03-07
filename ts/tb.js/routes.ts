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
  team: ApiT.Team;
};

export const eventList = Paths.eventList.route<Deps>(function(p, deps) {
  let team = checkForCalendar(deps);
  if (! team) return;

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
      period, team
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

// Function that redirects to settings if no calendars found
export const checkForCalendar = function(deps: Deps): ApiT.Team|undefined {
  let team = checkForTeam(deps);
  if (team && team.team_timestats_calendars &&
      team.team_timestats_calendars.length) return team;
  deps.Svcs.Nav.go(Paths.settings.href({ onboarding: true }));
  return;
}


/*
  Settings is both one of our onboarding screens and place to actually
  change settings for stuff.
*/

export interface SettingsRoute {
  page: "Settings";
  team: ApiT.Team;
  onboarding?: boolean;
}

export const settings = Paths.settings.route<Deps>(function(p, deps) {
  let team = checkForTeam(deps);
  if (! team) return;

  deps.dispatch({
    type: "ROUTE",
    route: {
      page: "Settings",
      team,
      onboarding: p.onboarding
    }
  });
});

export type RouteTypes =
  EventListRoute|
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
      settings
    ],

    // Deps
    () => ({ dispatch, state: getState(), Svcs, Conf }),

    // Opts
    { home: () => Paths.eventList.href({}) }
  );
}
