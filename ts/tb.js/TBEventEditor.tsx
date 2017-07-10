/*
  Single event sidebar for displaying event details for timebomb
*/
import * as React from "react";
import { LoggedInState as StoreState } from './types';
import EventEditor from "../components/EventEditor";
import TimebombToggle from "../components/TimebombToggle";
import GuestList from "../components/GuestList";
import RecurringTimebombModifier from "../components/RecurringTimebombModifier";
import * as ApiT from "../lib/apiT";
import { timebombPref } from "../lib/timebomb";
import { ready } from "../states/data-status";

interface Props {
  eventId?: string;
  teamId: string;
  onTimebombToggle: (
    eventId: string,
    val: boolean,
    forceInstance?: boolean
  ) => void;
  state: StoreState;
}

export class TBEventEditor extends React.Component<Props, {}> {
  render() {
    let eventMap = this.props.state.events[this.props.teamId] || {};
    let event = this.props.eventId ? eventMap[this.props.eventId] : undefined;
    return <EventEditor event={event} showGuests={false}>
      { ready(event) ? this.renderForEvent(event) : null }
    </EventEditor>
  }

  renderForEvent(event: ApiT.Event) {
    let loggedInUid = this.props.state.login.uid;
    return <div className="panel">
      <TimebombToggle
        loggedInUid={loggedInUid}
        event={event}
        onToggle={this.props.onTimebombToggle} />
      <RecurringTimebombModifier
        event={event}
        onForceInstance={() => this.props.onTimebombToggle(
          event.id, !timebombPref(event), true
        )}
      />
      <GuestList className="panel" event={event} />
    </div>;
  }
}

export default TBEventEditor;