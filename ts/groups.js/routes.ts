import * as Paths from "./paths";
import * as Routing from "../lib/routing";
import { Action, State } from "./types";
import { AnalyticsSvc } from "../lib/analytics";
import { ApiSvc } from "../lib/api";

export interface EventListRoute { page: "GroupEvents", groupId: string };
export const eventList = Paths.eventList.route<{
  dispatch: (action: Action) => any,
  state: State,
  Svcs: AnalyticsSvc & ApiSvc
}>(function(p, q, deps) {
  deps.Svcs.Analytics.page(["GroupEvents", { groupId: p.groupId }]);
  deps.dispatch({
    type: "ROUTE",
    route: {
      page: "GroupEvents",
      groupId: p.groupId
    }
  });
});

export interface SetupRoute { page: "Setup" };
export const setup = Paths.setup.route<{
  dispatch: (action: Routing.RouteAction<SetupRoute>) => any,
  state: {},
  Svcs: AnalyticsSvc
}>(function(p, q, deps) {
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
  Svcs: AnalyticsSvc & ApiSvc
) {
  Routing.init([
    eventList,
    setup
  ], {
    home: () => Paths.eventList.href({ groupId: "default" }, {}),
  }, { dispatch, getState, Svcs });
}
