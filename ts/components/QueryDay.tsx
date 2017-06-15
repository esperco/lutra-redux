/*
  QueryDay component is used to transform our store state for events --
  a map by event ID to event, with lists of event IDs for different days
  and queries -- into a more understandable array of events.

  It contains some performance tweaks so that the DOM doesn't get bogged
  down rendering very long sequences of events for longer stretches of time.
*/
import * as React from "react";
import DayBox from "../components/DayBox";
import TreeFall from "../components/TreeFall";
import * as ApiT from "../lib/apiT";
import { iter } from "../lib/event-query-iter";
import { stringify, QueryFilter } from "../lib/event-queries";
import { GenericPeriod, toDays, dateForDay } from "../lib/period";
import { StoreData } from "../states/data-status";
import { EventMap, QueryResult, EventsState } from "../states/events";

export type EventDataList =
  (StoreData<ApiT.GenericCalendarEvent>|undefined)[];
export type QueryDayCB =
  (events: EventDataList) => React.ReactNode|React.ReactNode[];

interface DayProps {
  day: number; // Period day index
  result: StoreData<QueryResult>;
  eventMap: EventMap;
  cb: QueryDayCB;
}

export class QueryDay extends TreeFall<DayProps, {}> {
  render() {
    if (! this.props.result || this.props.result === "FETCH_ERROR") {
      return this.renderEmpty();
    }

    let calEvents: (StoreData<ApiT.GenericCalendarEvent>|undefined)[] =
      this.props.result === "FETCHING" ? ["FETCHING"] :
      this.props.result.eventIds.map((id) => this.props.eventMap[id]);

    if (! calEvents.length) return this.renderEmpty();;

    return <div>
      { this.renderWaypoint() }
      <DayBox date={dateForDay(this.props.day)}>
        {/*
          Wrap child with extra div so flexbox doesn't expand height of
          child when it's too short.
        */}
        <div>{ this.props.cb(calEvents) }</div>
      </DayBox>
      { this.renderWaypoint() }
    </div>;
  }

  /*
    Need to render something (rather than null) if no data so we
    can check visibility when deciding whether to update. Use a span
    (since that shouldn't affect * + * CSS selectors or other spacing)
  */
  renderEmpty() {
    return <span>
      { this.renderWaypoint() }
    </span>;
  }
}

// Helper function for extracting QueryDay props from store state
export function mapQueryDays(props: {
  calgroupId: string;
  period: GenericPeriod;
  query: QueryFilter;
  state: EventsState;
  cb: QueryDayCB;
}): {
  total: number;    // Total number of unique events
  loaded: boolean;  // Are all events loaded?
  queryDays: JSX.Element[]; // QueryDay element list
} {
  let { calgroupId, state, period, cb } = props;
  let queryState = state.eventQueries[calgroupId] || [];
  let eventMap = state.events[calgroupId] || {};
  let queryKey = stringify(props.query);

  let { start, end } = toDays(period);
  let queryDays = queryState.slice(start, end);
  let total = 0;
  let loaded = iter(
    { ...props, calgroupId, query: {} },
    state,
    () => { total += 1; }
  );

  return {
    total,
    loaded,
    queryDays: queryDays.map((d, i) =>
      <QueryDay key={i} day={start + i}
        result={d[queryKey]}
        eventMap={eventMap}
        cb={cb}
      />)
  }
}

export default QueryDay;