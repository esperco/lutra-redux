/*
  Single event sidebar for displaying event details for timebomb
*/
import * as React from "react";
import { LoggedInState as StoreState } from './types';
import EventEditor from "../components/EventEditor";
import TimebombToggle from "../components/TimebombToggle";
import GuestList from "../components/GuestList";
import { ready } from "../states/data-status";

interface Props {
  eventId?: string;
  teamId: string;
  onTimebombToggle: (eventId: string, val: boolean) => void;
  state: StoreState;
}

export class TBEventEditor extends React.Component<Props, {}> {
  render() {
    let eventMap = this.props.state.events[this.props.teamId] || {};
    let event = this.props.eventId ? eventMap[this.props.eventId] : undefined;
    let loggedInUid = this.props.state.login.uid;
    return <EventEditor event={event}>
      { ready(event) ? <div>
        <TimebombToggle
          loggedInUid={loggedInUid}
          event={event}
          onToggle={this.props.onTimebombToggle} />

        <span />{/*
          So panel border below triggers even if timebomb toggle is null
        */}

        <GuestList className="panel" event={event} />
      </div> : null }
    </EventEditor>
  }
}

export default TBEventEditor;