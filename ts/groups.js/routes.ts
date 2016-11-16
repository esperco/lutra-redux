import * as Paths from "./paths";
import * as Routing from "../lib/routing";

export interface EventListRoute { page: "EVENT_LIST" };
export const eventList = Paths.eventList.route(function() {
  return { page: "EVENT_LIST" };
});

export interface SetupRoute { page: "SETUP" };
export const setup = Paths.setup.route(function() {
  return { page: "SETUP" };
});

export type RouteTypes = EventListRoute|SetupRoute;

export function init(
  dispatch: (a: Routing.RouteAction<RouteTypes>) => any
) {
  Routing.init([
    eventList,
    setup
  ], {
    dispatch,
    home: () => Paths.eventList.href({}, {})
  });
}
