import * as moment from "moment";
import * as Paths from "./paths";
import * as Routing from "../lib/routing";
import { Action, State } from "./types";
import { AnalyticsSvc } from "../lib/analytics";
import { ApiSvc } from "../lib/api";
import { GenericPeriod, fromDates } from "../lib/period";

interface Deps {
  dispatch: (action: Action) => any,
  state: State,
  Svcs: AnalyticsSvc & ApiSvc & Routing.NavSvc,
  Conf: { cacheDuration?: number; maxDaysFetch?: number; }
}

export interface EventListRoute {
  page: "EventList";
  period: GenericPeriod;
};

export const eventList = Paths.eventList.route<Deps>(function(p, deps) {
  // Default period = today + 6 (7 days total)
  let period = p.period || fromDates(
    new Date(),
    moment(new Date()).add(6, 'days').toDate()
  );

  // Dispatch route changes
  deps.dispatch({
    type: "ROUTE",
    route: {
      page: "EventList",
      period
    }
  });
});

export type RouteTypes =
  EventListRoute;

export function init({ dispatch, getState, Svcs, Conf }: {
  dispatch: (action: Action) => any,
  getState: () => State,
  Svcs: AnalyticsSvc & ApiSvc & Routing.NavSvc,
  Conf: { cacheDuration?: number; maxDaysFetch?: number; }
}) {
  Routing.init<Deps>(
    [ // Routes
      eventList
    ],

    // Deps
    () => ({ dispatch, state: getState(), Svcs, Conf }),

    // Opts
    { home: () => Paths.eventList.href({}) }
  );
}
