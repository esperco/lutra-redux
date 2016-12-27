import * as moment from "moment";
import * as Paths from "./paths";
import * as Routing from "../lib/routing";
import { Action, State } from "./types";
import { AnalyticsSvc } from "../lib/analytics";
import { ApiSvc } from "../lib/api";
import { QueryFilter, reduce } from "../lib/event-queries";
import { GenericPeriod, fromDates } from "../lib/period";
import * as Events from "../handlers/group-events";
import * as Groups from "../handlers/groups"
import * as Log from "../lib/log";
import { compactObject } from "../lib/util";

export interface EventListRoute {
  page: "GroupEvents";
  groupId: string;
  showFilters?: boolean;
  eventId?: string;
  query: QueryFilter;
  period: GenericPeriod;
};
export const eventList = Paths.eventList.route<{
  dispatch: (action: Action) => any,
  state: State,
  Svcs: ApiSvc
}>(function(p, deps) {
  let groupId = Groups.cleanGroupId(p.groupId, deps.state);
  if (groupId) {
    // Default period = 2 weeks
    let period = p.period || fromDates("week",
      new Date(),
      moment(new Date()).add(1, 'week').toDate()
    );

    // Default labels => all / true
    let labels = p.labels || { all: true };

    let query: QueryFilter = reduce({
      labels,
      contains: p.contains,
      participants: p.participants,
      minCost: p.minCost
    });

    Groups.fetch(groupId, { withLabels: true }, deps);
    Events.fetchGroupEvents({
      groupId,
      period,
      query
    }, deps);

    deps.dispatch({
      type: "ROUTE",
      route: compactObject({
        page: "GroupEvents" as "GroupEvents",
        groupId: groupId,
        showFilters: p.showFilters,
        eventId: p.eventId || undefined,
        query, period
      })
    });
  } else {
    Log.e("Missing groupId", p.groupId);
    deps.dispatch({
      type: "ROUTE",
      route: { page: "NotFound" }
    });
  }
});

export interface SetupRoute { page: "Setup" };
export const setup = Paths.setup.route<{
  dispatch: (action: Routing.RouteAction<SetupRoute>) => any,
}>(function(p, deps) {
  deps.dispatch({
    type: "ROUTE",
    route: { page: "Setup" }
  });
});

export type RouteTypes = EventListRoute|SetupRoute;

export function init(
  dispatch: (a: Routing.RouteAction<RouteTypes>) => any,
  getState: () => State,
  Svcs: AnalyticsSvc & ApiSvc & Routing.NavSvc
) {
  Routing.init(
    [ // Routes
      eventList,
      setup
    ],

    // Deps
    () => ({ dispatch, state: getState(), Svcs }),

    // Opts
    { home: () => Paths.eventList.href({
      groupId: "default",
      showFilters: false,
      eventId: ""
    }) }
  );
}
