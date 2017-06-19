/*
  Event list with awareness of hidden events and predicted labels.
  Hides hidden events unless confirmation is required.
*/

require("less/components/_event-predictions.less");
import * as classNames from "classnames";
import * as React from "react";
import * as ApiT from "../lib/apiT";
import { Props, mapEvents } from "./EventList";
import Tooltip from "./Tooltip";
import * as EventText from "../text/events";

interface State {
  // Sould we show hidden events?
  showHiddenEvents: boolean;
}

export class EventPredictionsList extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      showHiddenEvents: false
    };
  }

  render() {
    let { events, className, cb } = this.props;
    let hiddenCount = 0;
    let eventContent = mapEvents({
      events,
      cb: (ev) => {
        if (this.isHidden(ev)) {
          hiddenCount += 1;
          if (! this.state.showHiddenEvents) {
            return null;
          }
        }
        return cb(ev);
      }
    });

    return <div className={classNames("event-predictions-list", className)}>
      { this.renderHiddenEventMsg(hiddenCount) }
      { eventContent }
    </div>;
  }

  renderHiddenEventMsg(count: number) {
    if (! count) return null;
    return <div className="hidden-events panel">
      <Tooltip
        title={EventText.HiddenEventsDescription}
        target={<button onClick={() => this.toggleHiddenEvents()}>
          { this.state.showHiddenEvents ?
            EventText.HideHidden :
            EventText.hiddenEventsMsg(count) }
        </button>}
      />
    </div>;
  }

  isHidden(ev: ApiT.GenericCalendarEvent) {
    return ev.hidden && ev.labels_confirmed;
  }

  toggleHiddenEvents = () => {
    this.setState({
      ...this.state,
      showHiddenEvents: !this.state.showHiddenEvents
    });
  }
}

export default EventPredictionsList;

