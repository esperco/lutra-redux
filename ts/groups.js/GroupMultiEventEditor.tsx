/*
  Multi event sidebar from GroupEvents
*/
import * as _ from "lodash";
import * as React from "react";
import { State as StoreState, DispatchFn, PostTaskFn } from './types';
import MultiEventEditor from "../components/MultiEventEditor";
import * as Events from "../handlers/events";
import { ApiSvc } from "../lib/api";
import * as ApiT from "../lib/apiT";
import { LabelSet } from "../lib/event-labels";
import { QueryFilter } from "../lib/event-queries";
import { GenericPeriod } from "../lib/period";
import { ready } from "../states/data-status";

interface Props {
  groupId: string;
  period: GenericPeriod;  // For handler context
  query: QueryFilter;     // For handler context
  labelHrefFn?: (l: ApiT.LabelInfo) => string;
  labels: LabelSet;
  searchLabels: LabelSet;
  state: StoreState;
  dispatch: DispatchFn;
  postTask: PostTaskFn;
  Svcs: ApiSvc;
  Conf?: { maxDaysFetch?: number; }
}

export class GroupMultiEventEditor extends React.Component<Props, {}> {
  render() {
    let { groupId, labels, searchLabels, state, query, period } = this.props;
    let context = { query, period };
    let eventMap = state.events[groupId] || {};
    let events = _(state.selectedEvents)
      .map((v: true, k: string) => eventMap[k])
      .filter(ready)
      .compact()
      .value() as ApiT.GenericCalendarEvent[];

    return <MultiEventEditor
      events={events}
      labels={labels}
      searchLabels={searchLabels}
      onChange={(eventIds, label, active) => Events.setGroupEventLabels({
        groupId: this.props.groupId,
        eventIds,
        label, active, context
      }, this.props)}
      onHide={(eventIds, hidden) => Events.setGroupEventLabels({
        groupId: this.props.groupId,
        eventIds,
        hidden, context
      }, this.props)}
      labelHrefFn={this.props.labelHrefFn}
    />
  }
}

export default GroupMultiEventEditor;