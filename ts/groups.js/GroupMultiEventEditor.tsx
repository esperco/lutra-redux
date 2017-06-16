/*
  Multi event sidebar from GroupEvents
*/
import * as React from "react";
import { State as StoreState, DispatchFn, PostTaskFn } from './types';
import MultiEventEditor from "../components/MultiEventEditor";
import LabelList from "../components/LabelList";
import MultiRecurringLabelModifier from
  "../components/MultiRecurringLabelsModifier";
import * as Events from "../handlers/events";
import { ApiSvc } from "../lib/api";
import * as ApiT from "../lib/apiT";
import { LabelSet } from "../lib/event-labels";
import { QueryFilter } from "../lib/event-queries";
import { GenericPeriod } from "../lib/period";
import { ready, StoreData } from "../states/data-status";
import * as Text from "../text/events";

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
    let events: (StoreData<ApiT.GenericCalendarEvent>|undefined)[] = [];
    let validEvents: ApiT.GenericCalendarEvent[] = [];
    for (let id in state.selectedEvents) {
      let event = eventMap[id];
      events.push(event);
      if (ready(event)) {
        validEvents.push(event);
      }
    }

    return <MultiEventEditor
      events={events}
      menu={(events) => {
        let hasHiddenEvents = !!events.find((e) => !!e.hidden)
        return <div className="dropdown-menu"><div className="menu">
          <button
            className="hide-btn"
            onClick={() => Events.setGroupEventLabels({
              groupId: this.props.groupId,
              eventIds: events.map((e) => e.id),
              hidden: !hasHiddenEvents, context
            }, this.props)}
          >
            <span>{ hasHiddenEvents ? Text.Show : Text.Hide }</span>
            <div className="description">
              { hasHiddenEvents ?
                Text.ShowMultiDescription :
                Text.HideMultiDescription }
            </div>
          </button>
        </div></div>
      }}
    >
      { events.length === validEvents.length ? <div>
        <LabelList
          events={validEvents}
          labels={labels}
          labelHrefFn={this.props.labelHrefFn}
          searchLabels={searchLabels}
          onChange={(eventIds, label, active) => Events.setGroupEventLabels({
            groupId: this.props.groupId,
            eventIds,
            label, active, context
          }, this.props)}
        />
        <MultiRecurringLabelModifier events={validEvents} />
      </div> : null }
    </MultiEventEditor>
  }
}

export default GroupMultiEventEditor;