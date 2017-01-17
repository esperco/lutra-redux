/*
  Single event sidebar from GroupEvents
*/
import * as _ from "lodash";
import * as React from "react";
import { State as StoreState, DispatchFn } from './types';
import EventEditor from "../components/EventEditor";
import * as Events from "../handlers/group-events";
import { ApiSvc } from "../lib/api";
import * as ApiT from "../lib/apiT";
import { LabelSet } from "../lib/event-labels";
import { ready } from "../states/data-status";

interface Props {
  groupId: string;
  eventId: string;
  guestHrefFn?: (x: ApiT.Attendee) => string;
  labelHrefFn?: (l: ApiT.LabelInfo) => string;
  state: StoreState;
  dispatch: DispatchFn;
  Svcs: ApiSvc;
  Conf?: { maxDaysFetch?: number; }
}

export class GroupEventEditor extends React.Component<Props, {}> {
  render() {
    let eventMap = this.props.state.groupEvents[this.props.groupId] || {};
    let members = this.props.state.groupMembers[this.props.groupId];
    let group = this.props.state.groupLabels[this.props.groupId];
    let labels = new LabelSet(ready(group) ? group.group_labels : []);
    let searchLabels = labels.with(
      ... _.values(this.props.state.groupLabelSuggestions[this.props.groupId])
    );
    return <EventEditor
      event={eventMap[this.props.eventId]}
      members={members}
      labels={labels}
      searchLabels={searchLabels}
      loginDetails={this.props.state.login}
      onChange={(label, active) => Events.setGroupEventLabels({
        groupId: this.props.groupId,
        eventIds: this.props.eventId ? [this.props.eventId] : [],
        label, active
      }, this.props)}
      onForceInstance={() => Events.setGroupEventLabels({
        groupId: this.props.groupId,
        eventIds: this.props.eventId ? [this.props.eventId] : []
      }, this.props, { forceInstance: true })}
      onHide={(hidden) => Events.setGroupEventLabels({
        groupId: this.props.groupId,
        eventIds: this.props.eventId ? [this.props.eventId] : [],
        hidden
      }, this.props)}
      onCommentPost={(eventId, text) =>
        Events.postGroupEventComment({
          groupId: this.props.groupId,
          eventId,
          text
        }, {...this.props})
      }
      onCommentDelete={(eventId, commentId) =>
        Events.deleteGroupEventComment({
          groupId: this.props.groupId,
          eventId,
          commentId
        }, {...this.props})
      }
      labelHrefFn={this.props.labelHrefFn}
      guestHrefFn={this.props.guestHrefFn}
    />
  }
}

export default GroupEventEditor;