/*
  Single event sidebar for displaying event details for feedback
*/
import * as React from "react";
import { LoggedInState as StoreState } from './types';
import EventEditor from "../components/EventEditor";
import FeedbackToggle from "../components/FeedbackToggle";
import RecurringFeedbackModifier from "../components/RecurringFeedbackModifier";
import GuestList from "../components/GuestList";
import * as ApiT from "../lib/apiT";
import { feedbackPref, useRecurringPref } from "../lib/feedback";
import { ready } from "../states/data-status";

interface Props {
  eventId?: string;
  teamId: string;
  state: StoreState;
  onFeedbackToggle: (
    eventId: string,
    val: boolean,
    forceInstance?: boolean
  ) => void;
}

export class FBEventEditor extends React.Component<Props, {}> {
  render() {
    let eventMap = this.props.state.events[this.props.teamId] || {};
    let event = this.props.eventId ? eventMap[this.props.eventId] : undefined;
    return <EventEditor
      event={event}
      recur={useRecurringPref}
      showGuests={false}
    >
      { ready(event) ? this.renderForEvent(event) : null }
    </EventEditor>
  }

  renderForEvent(event: ApiT.Event) {
    return <div className="panel">
      <FeedbackToggle
        event={event}
        onToggle={(val) => this.props.onFeedbackToggle(event.id, val)}
      />
      <RecurringFeedbackModifier
        event={event}
        onForceInstance={() => this.props.onFeedbackToggle(
          event.id, !feedbackPref(event), true
        )}
      />
      <GuestList className="panel" event={event} />
    </div>;
  }
}

export default FBEventEditor;