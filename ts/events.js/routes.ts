import * as _ from "lodash";
import * as Paths from "./paths";
import * as Now from "../now.js/paths";
import * as Groups from "../groups.js/paths";
import * as Time from "../time.js/paths";
import * as Routing from "../lib/routing";
import { Action, State } from "./types";
import { AnalyticsSvc } from "../lib/analytics";
import { ApiSvc } from "../lib/api";

interface Deps {
  dispatch: (action: Action) => any,
  state: State,
  Svcs: AnalyticsSvc & ApiSvc & Routing.NavSvc
}

export interface EventRoute {
  page: "Event";
  eventId: string;
};

export const event = Paths.event.route<Deps>(function(p, deps) {
  if (p.eventId && deps.state.login) {
    let { teams, groups } = deps.state.login;
    let eventId = p.eventId;
    teams = _.filter(teams, (t) => !t.groups_only);

    // If only one team and no groups ...
    if (teams.length === 1 && groups.length === 0) {
      deps.Svcs.Nav.go(Now.Event.href({
        eventId,
        team: teams[0].teamid
      }));
    }

    // Else if one group and no teams
    else if (teams.length === 0 && groups.length === 1) {
      deps.Svcs.Nav.go(Groups.eventList.href({
        groupId: groups[0],
        eventId
      }));
    }

    // Else if no group or teams at all
    else if (teams.length === 0 && groups.length === 0) {
      deps.Svcs.Nav.go(Time.Home.href({}));
    }

    // Dispatch route changes
    else {
      deps.dispatch({
        type: "ROUTE",
        route: {
          page: "Event",
          eventId
        }
      });
    }
  }
});

export type RouteTypes = EventRoute;

export function init({ dispatch, getState, Svcs }: {
  dispatch: (action: Action) => any,
  getState: () => State,
  Svcs: AnalyticsSvc & ApiSvc & Routing.NavSvc
}) {
  Routing.init<Deps>(
    [ // Routes
      event
    ],

    // Deps
    () => ({ dispatch, state: getState(), Svcs })

    // NB: No home route -> goes to not found by default
  );
}
