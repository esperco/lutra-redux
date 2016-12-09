import * as Paths from "./paths";
import * as Routing from "../lib/routing";
import { Action, State } from "./types";
import { AnalyticsSvc } from "../lib/analytics";
import { ApiSvc } from "../lib/api";
import * as ASN from "../lib/asn";
import * as Groups from "../handlers/groups"
import * as Log from "../lib/log";
import { compactObject } from "../lib/util";

export interface EventListRoute {
  page: "GroupEvents";
  groupId: string;
  showFilters?: boolean;
  eventId?: string;
  labels: ASN.AllSomeNone;
};
export const eventList = Paths.eventList.route<{
  dispatch: (action: Action) => any,
  state: State,
  Svcs: ApiSvc
}>(function(p, deps) {
  let groupId = Groups.cleanGroupId(p.groupId, deps.state);
  if (groupId) {
    Groups.fetch(groupId, { withLabels: true }, deps);
    deps.dispatch({
      type: "ROUTE",
      route: compactObject({
        page: "GroupEvents" as "GroupEvents",
        groupId: groupId,
        showFilters: p.showFilters,
        eventId: p.eventId || undefined,
        labels: p.labels || { all: true }
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
