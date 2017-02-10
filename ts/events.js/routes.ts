import * as Paths from "./paths";
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
  if (p.eventId) {
    // Dispatch route changes
    deps.dispatch({
      type: "ROUTE",
      route: {
        page: "Event",
        eventId: p.eventId
      }
    });
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
