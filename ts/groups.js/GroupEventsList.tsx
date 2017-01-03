/*
  Groups-specific wrapper around event list component
*/
import * as _ from "lodash";
import * as React from "react";
import { State, DispatchFn } from './types';
import DayBox from "../components/DayBox";
import EventList from "../components/EventList";
import * as Events from "../handlers/group-events";
import { ApiSvc } from "../lib/api";
import * as ApiT from "../lib/apiT";
import { QueryFilter, stringify } from "../lib/event-queries";
import { GenericPeriod, toDays, dateForDay } from "../lib/period";
import { ready, StoreData } from "../states/data-status";
import { GroupLabels } from "../states/groups";
import { EventMap, QueryResult } from "../states/group-events";

interface Props {
  groupId: string;
  period: GenericPeriod;
  query: QueryFilter;
  eventHrefFn?: (ev: ApiT.GenericCalendarEvent) => string;
  state: State;
  dispatch: DispatchFn;
  Svcs: ApiSvc;
}

export class GroupEventsList extends React.Component<Props, {}> {
  render() {
    let { groupId, state, period, query } = this.props;
    let groupLabels = state.groupLabels[groupId];
    let queryState = state.groupEventQueries[groupId] || [];
    let eventMap = state.groupEvents[groupId] || {};

    let { start, end } = toDays(period);
    let queryDays = queryState.slice(start, end + 1);
    let queryKey = stringify(query);

    return <div>
      { _.map(queryDays, (d, i) =>
        <QueryDay key={i} day={start + i} result={d[queryKey]}
          eventMap={eventMap}
          groupLabels={groupLabels}
          eventHrefFn={this.props.eventHrefFn}
          onChange={this.onChange}
        />
      ) }
    </div>;
  }

  onChange = (eventIds: string[], label: ApiT.LabelInfo, active: boolean) => {
    Events.setGroupEventLabels({
      groupId: this.props.groupId,
      eventIds, label, active
    }, this.props)
  }
}


interface DayProps {
  day: number; // Period day index
  groupLabels: StoreData<GroupLabels>|undefined;
  result: StoreData<QueryResult>;
  eventMap: EventMap;
  eventHrefFn?: (ev: ApiT.GenericCalendarEvent) => string;
  onChange: (
    eventIds: string[],
    x: ApiT.LabelInfo,
    active: boolean
  ) => void;
}

class QueryDay extends React.Component<DayProps, {}> {
  render() {
    if (! this.props.result || this.props.result === "FETCH_ERROR") {
      return null;
    }

    let calEvents: (StoreData<ApiT.GenericCalendarEvent>|undefined)[] =
      this.props.result === "FETCHING" ? ["FETCHING"] :
      _.map(this.props.result.eventIds, (id) => this.props.eventMap[id]);

    if (_.isEmpty(calEvents)) return null;

    return <DayBox date={dateForDay(this.props.day)}>
      <EventList events={calEvents}
        eventHrefFn={this.props.eventHrefFn}
        labels={ ready(this.props.groupLabels) ?
          this.props.groupLabels.group_labels : [] }
        onChange={this.props.onChange}
      />
    </DayBox>;
  }
}

export default GroupEventsList;
