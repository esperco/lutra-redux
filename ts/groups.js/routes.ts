import * as Paths from "./paths";
import * as Routing from "../lib/routing";
import { AnalyticsSvc } from "../lib/analytics";
import { ApiSvc } from "../lib/api";

export interface EventListRoute { page: "GroupEvents" };
export const eventList = Paths.eventList.route<EventListRoute, AnalyticsSvc>(
  function(p, q, Svcs) {
    Svcs.Analytics.page(["GroupEvents", { groupId: p.groupId }])
    return { page: "GroupEvents" };
  });

export interface SetupRoute { page: "Setup" };
export const setup = Paths.setup.route<SetupRoute, AnalyticsSvc>(
  function(p, q, Svcs) {
    Svcs.Analytics.page("GroupSetup");
    return { page: "Setup" };
  });

export type RouteTypes = EventListRoute|SetupRoute;

export function init(
  dispatch: (a: Routing.RouteAction<RouteTypes>) => any,
  svcs: AnalyticsSvc & ApiSvc
) {
  Routing.init([
    eventList,
    setup
  ], {
    dispatch,
    home: () => Paths.eventList.href({ groupId: "default" }, {}),
    services: svcs
  });
}
