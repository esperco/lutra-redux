/*
  Single event sidebar from GroupEvents
*/
import * as React from "react";
import { State as StoreState, DispatchFn, PostTaskFn } from './types';
import { EventConfirmSpan } from "../components/EventConfirmBox";
import EventEditor from "../components/EventEditor";
import LabelList from "../components/LabelList";
import RecurringLabelModifier from "../components/RecurringLabelModifier";
import GuestList from "../components/GuestList";
import * as Events from "../handlers/events";
import { ApiSvc } from "../lib/api";
import * as ApiT from "../lib/apiT";
import { LabelSet } from "../lib/event-labels";
import { QueryFilter } from "../lib/event-queries";
import { GenericPeriod } from "../lib/period";
import { ready } from "../states/data-status";
import * as Text from "../text/events";

// Viewing event in editor will confirm its labels after this time in ms
const DEFAULT_AUTO_CONFIRM_TIMEOUT = 1500;

interface Props {
  groupId: string;
  period: GenericPeriod;  // For handler context
  query: QueryFilter;     // For handler context
  guestHrefFn?: (x: ApiT.Attendee) => string;
  labelHrefFn?: (l: ApiT.LabelInfo) => string;
  labels: LabelSet;
  searchLabels: LabelSet;
  state: StoreState;
  dispatch: DispatchFn;
  postTask: PostTaskFn;
  Svcs: ApiSvc;
  Conf?: { maxDaysFetch?: number; }
}

export class GroupEventEditor extends React.Component<Props, {}> {
  render() {
    let eventId = Object.keys(this.props.state.selectedEvents)[0];
    let eventMap = this.props.state.events[this.props.groupId] || {};
    let event = eventMap[eventId];
    let { labels, searchLabels } = this.props;
    let context = {
      query: this.props.query,
      period: this.props.period
    };

    return <EventEditor
      event={event}
      showGuests={false}
      menu={(event) => <div className="dropdown-menu">
        <div className="menu">
          <button
            className="hide-btn"
            onClick={() => Events.setGroupEventLabels({
              groupId: this.props.groupId,
              eventIds: eventId ? [eventId] : [],
              hidden: !event.hidden, context
            }, this.props)}
          >
            <span>{ event.hidden ? Text.Show : Text.Hide }</span>
            <div className="description">
              { event.hidden ?
                Text.ShowDescription :
                Text.HideDescription }
            </div>
          </button>
        </div>
      </div>}
    >
      { ready(event) ? <div>
        <EventConfirmSpan
          event={event}
          onConfirm={() => Events.setGroupEventLabels({
            groupId: this.props.groupId,
            eventIds: eventId ? [eventId] : [],
            passive: false
          }, this.props)}
          autoConfirmTimeout={DEFAULT_AUTO_CONFIRM_TIMEOUT}
        />

        <LabelList
          events={[event]}
          labels={labels}
          labelHrefFn={this.props.labelHrefFn}
          searchLabels={searchLabels}
          onChange={(eventIds, label, active) => Events.setGroupEventLabels({
            groupId: this.props.groupId,
            eventIds, label, active, context
          }, this.props)}
        />

        <RecurringLabelModifier
          event={event}
          onForceInstance={() => Events.setGroupEventLabels({
            groupId: this.props.groupId,
            eventIds: eventId ? [eventId] : []
          }, this.props, { forceInstance: true })}
        />

        <GuestList
          className="panel"
          event={event}
          hrefFn={this.props.guestHrefFn}
        />
      </div> : null }
    </EventEditor>
  }
}

export default GroupEventEditor;