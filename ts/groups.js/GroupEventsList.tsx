/*
  Event list component that takes advantage of how we store
  queries to be efficient about React updates
*/
import * as _ from "lodash";
// import * as moment from "moment";
import * as React from "react";
import * as stringify from "json-stable-stringify";
import DayBox from "../components/DayBox";
import EventList from "../components/EventList";
import * as ApiT from "../lib/apiT";
import { GenericPeriod, toDays, dateForDay } from "../lib/period";
import { StoreData } from "../states/data-status";
import {
  Query, EventsQueryState, EventMap, QueryResult
} from "../states/group-events";

interface Props {
  period: GenericPeriod;
  query: Query;
  queryState: EventsQueryState;
  eventMap: EventMap;
  eventHrefFn?: (ev: ApiT.GenericCalendarEvent) => string;
}

export class GroupEventsList extends React.Component<Props, {}> {
  render() {
    let { start, end } = toDays(this.props.period);
    let queryDays = this.props.queryState.slice(start, end + 1);
    let queryKey = stringify(this.props.query);

    return <div>
      { _.map(queryDays, (d, i) =>
        <QueryDay
          key={i} {...this.props}
          day={start + i}
          result={d[queryKey]}
        />
      ) }
    </div>;
  }
}


interface DayProps {
  day: number; // Period day index
  result: StoreData<QueryResult>;
  eventMap: EventMap;
  eventHrefFn?: (ev: ApiT.GenericCalendarEvent) => string;
}

class QueryDay extends React.Component<DayProps, {}> {
  /*
    Note that we omit eventMap because any update to eventMap should
    also invalidate a queryState;
  */
  shouldComponentUpdate(nextProps: DayProps) {
    return nextProps.result !== this.props.result;
  }

  render() {
    if (! this.props.result || this.props.result === "FETCH_ERROR") {
      return null;
    }

    let calEvents: (StoreData<ApiT.GenericCalendarEvent>|undefined)[] =
      this.props.result === "FETCHING" ? ["FETCHING"] :
      _.map(this.props.result.eventIds, (id) => this.props.eventMap[id]);

    if (_.isEmpty(calEvents)) return null;

    return <DayBox date={dateForDay(this.props.day)}>
      <EventList events={calEvents} eventHrefFn={this.props.eventHrefFn} />
    </DayBox>;
  }
}

export default GroupEventsList;
