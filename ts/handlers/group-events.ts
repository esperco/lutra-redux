import * as ApiT from "../lib/apiT";
import * as _ from "lodash";
import { ApiSvc } from "../lib/api";
import { GenericPeriod, bounds, toDays } from "../lib/period";
import { ready, ok } from "../states/data-status";
import { Query, EventsState, EventsDataAction } from "../states/group-events";
import * as stringify from "json-stable-stringify";

export function fetchGroupEvents(props: {
  groupId: string;
  period: GenericPeriod;
  query: Query;
}, deps: {
  dispatch: (a: EventsDataAction) => any;
  state: EventsState;
  Svcs: ApiSvc;
  Conf?: { cacheDuration: number }
}): Promise<void> {
  if (shouldUpdate(props, deps)) {
    deps.dispatch({
      type: "GROUP_EVENTS_DATA",
      dataType: "FETCH_QUERY_START",
      ...props
    });

    let [start, end] = bounds(props.period);
    return deps.Svcs.Api.postForGroupEvents(props.groupId, {
      window_start: start.toISOString(),
      window_end: end.toISOString()
    }).then(
      (result) => {
        /*
          NB: We currently have to sort through each calendar result in
          result and merge, but ideally server should just return a
          single list of events here.
        */
        let events: ApiT.GenericCalendarEvent[] = [];
        _.each(result, (v) => {
          events = events.concat(v.events);
        });
        events.sort(sortFn);

        deps.dispatch({
          type: "GROUP_EVENTS_DATA",
          dataType: "FETCH_QUERY_END",
          events, ...props
        });
      },

      // Dispatch error action otherwise
      (err) => {
        deps.dispatch({
          type: "GROUP_EVENTS_DATA",
          dataType: "FETCH_QUERY_FAIL",
          ...props
        });
      }
    );
  }
  return Promise.resolve(undefined);
}

// Use in sorting function to sort based on start, then end times
function sortFn(e1: ApiT.GenericCalendarEvent, e2: ApiT.GenericCalendarEvent) {
  let startE1 = new Date(e1.start);
  let startE2 = new Date(e2.start);
  let endE1 = new Date(e1.end);
  let endE2 = new Date(e2.end);
  let startDiff = startE1.getTime() - startE2.getTime();
  return startDiff != 0 ? startDiff :
         endE1.getTime() - endE2.getTime();
}

// Should we fetch event query again?
function shouldUpdate(props: {
  groupId: string;
  period: GenericPeriod;
  query: Query;
}, deps: {
  state: EventsState;
  Conf?: { cacheDuration: number }
}) {
  let { groupId, period, query } = props;
  let { state, Conf } = deps;
  let queryKey = stringify(query);
  let queryDays = state.groupEventQueries[groupId];
  if (queryDays) {
    let {start, end} = toDays(period);
    for (let i = start; i <= end; i++) {
      let queries = queryDays[i];
      if (! queries) {
        return true;
      }

      let queryData = queries[queryKey];
      if (! ok(queryData)) {
        return true;
      }

      if (ready(queryData)) {
        if (queryData.invalid) {
          return true;
        }

        if (Conf && _.isNumber(Conf.cacheDuration) &&
            queryData.updatedOn.getTime() + Conf.cacheDuration
              < (new Date()).getTime()
        ) {
          return true;
        }
      }
    }
    return false;
  }
  return true;
}


/* Fetch events by IDs */

// TODO -- Need API endpoint for this though
export function fetchByIds(props: {
  groupId: string;
  eventIds: string[];
}, deps: {
  dispatch: (a: EventsDataAction) => any;
  state: EventsState;
  Svcs: ApiSvc;
}) {

}