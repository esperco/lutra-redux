import * as Paths from "./paths";
import * as Routing from "../lib/routing";
import { Action, State } from "./types";
import { AnalyticsSvc } from "../lib/analytics";
import { ApiSvc } from "../lib/api";
import * as Groups from "../handlers/groups"
import * as Log from "../lib/log";

export interface EventListRoute { page: "GroupEvents", groupId: string };
export const eventList = Paths.eventList.route<{
  dispatch: (action: Action) => any,
  state: State,
  Svcs: AnalyticsSvc & ApiSvc & Routing.NavSvc
}>(function(p, deps) {
  deps.Svcs.Analytics.page(["GroupEvents", { groupId: p.groupId }]);
  let groupId = Groups.cleanGroupId(p.groupId, deps.state);
  if (groupId) {
    Groups.fetch(groupId, { withLabels: true }, deps);
    deps.dispatch({
      type: "ROUTE",
      route: {
        page: "GroupEvents",
        groupId: groupId
      }
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
  state: {},
  Svcs: AnalyticsSvc & Routing.NavSvc
}>(function(p, deps) {
  deps.Svcs.Analytics.page("GroupSetup");
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
    { home: () => Paths.eventList.href({ groupId: "default" }) }
  );
}
