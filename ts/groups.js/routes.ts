import * as moment from "moment";
import * as Paths from "./paths";
import * as Routing from "../lib/routing";
import { Action, State, PostTaskFn } from "./types";
import { AnalyticsSvc } from "../lib/analytics";
import { ApiSvc } from "../lib/api";
import { QueryFilter, reduce } from "../lib/event-queries";
import { GenericPeriod, fromDates } from "../lib/period";
import * as Calcs from "../handlers/group-calcs";
import * as Events from "../handlers/group-events";
import * as Groups from "../handlers/groups"
import * as Log from "../lib/log";
import { compactObject } from "../lib/util";

interface Deps {
  dispatch: (action: Action) => any,
  state: State,
  postTask: PostTaskFn,
  Svcs: AnalyticsSvc & ApiSvc & Routing.NavSvc,
}

export interface EventListRoute {
  page: "GroupEvents";
  groupId: string;
  showFilters?: boolean;
  eventId?: string;
  query: QueryFilter;
  period: GenericPeriod;
};
export const eventList = Paths.eventList.route<Deps>(function(p, deps) {
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

    let props = { groupId, period, query };
    let p1 = Groups.fetch(groupId, { withLabels: true, withMembers: true }, deps);
    let p2 = Events.fetchGroupEvents(props, deps);
    Calcs.startGroupCalc(props, {
      ...deps,
      promise: Promise.all([p1, p2])
    });

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
export const setup = Paths.setup.route<Deps>(function(p, deps) {
  deps.dispatch({
    type: "ROUTE",
    route: { page: "Setup" }
  });
});

export type RouteTypes = EventListRoute|SetupRoute;

export function init({ dispatch, getState, postTask, Svcs }: {
  dispatch: (action: Action) => any,
  getState: () => State,
  postTask: PostTaskFn,
  Svcs: AnalyticsSvc & ApiSvc & Routing.NavSvc,
}) {
  Routing.init<Deps>(
    [ // Routes
      eventList,
      setup
    ],

    // Deps
    () => ({ dispatch, state: getState(), postTask, Svcs }),

    // Opts
    { home: () => Paths.eventList.href({
      groupId: "default",
      showFilters: false,
      eventId: ""
    }) }
  );
}
