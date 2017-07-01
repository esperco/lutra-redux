/*
  Single event sidebar for displaying event details for feedback
*/
import * as React from "react";
import { LoggedInState as StoreState } from './types';
import EventEditor from "../components/EventEditor";
import FeedbackToggle from "../components/FeedbackToggle";
import GuestList from "../components/GuestList";
import { ready } from "../states/data-status";

interface Props {
  eventId?: string;
  teamId: string;
  state: StoreState;
  onFeedbackToggle: (eventId: string, val: boolean) => void;
}

export class FBEventEditor extends React.Component<Props, {}> {
  render() {
    let eventMap = this.props.state.events[this.props.teamId] || {};
    let event = this.props.eventId ? eventMap[this.props.eventId] : undefined;
    return <EventEditor event={event} showGuests={false}>
      { ready(event) ? <div className="panel">
        <FeedbackToggle
          event={event}
          onToggle={(val) => this.props.eventId &&
            this.props.onFeedbackToggle(this.props.eventId, val)
          }
        />

        <GuestList className="panel" event={event} />
      </div> : null }
    </EventEditor>
  }
}

export default FBEventEditor;