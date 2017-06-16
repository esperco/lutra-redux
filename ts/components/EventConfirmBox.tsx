/*
  A variant of the Event Box with Waypoints to do auto-confirmation when
  a user scrolls down to it. Also adds additional event-related classes
  to box such as hidden status and confirmation status.
*/

require("less/components/_event-info.less");
import * as React from "react";
import { Box, BoxProps } from "../components/EventInfo";
import * as ApiT from "../lib/apiT";
import Waypoint from "./Waypoint";
import * as classNames from "classnames";

// Viewing event in list will confirm its labels after this time in ms
const DEFAULT_AUTO_CONFIRM_TIMEOUT = 3000;

export interface SpanProps {
  event: ApiT.GenericCalendarEvent;
  onConfirm: () => void;
  autoConfirmTimeout?: number;
}

// Standalone confirmation span if this is all we need
export class EventConfirmSpan extends React.Component<SpanProps, {}> {
  _timeout?: number;

  // Don't fire confirmation timeout if we skipped past it really fast
  componentWillUnmount() {
    if (typeof this._timeout !== "undefined") {
      clearTimeout(this._timeout);
    }
  }

  render() {
    let { event } = this.props;
    let unconfirmed = event.labels_predicted && !event.labels_confirmed;
    if (unconfirmed) {
      return <span className="confirm-waypoint">
        <Waypoint
          fireOnRapidScroll={false}
          onEnter={this.setConfirmTimeout}
          onLeave={this.clearConfirmTimeout}
        />
      </span>;
    }
    return null;
  }

  // Once event has been viewed. Auto-confirm after a short timeout.
  setConfirmTimeout = () => {
    if (typeof this._timeout === "undefined" &&
        this.props.autoConfirmTimeout !== Infinity) {
      this._timeout = setTimeout(() => this.props.onConfirm(),
        this.props.autoConfirmTimeout || DEFAULT_AUTO_CONFIRM_TIMEOUT);
    }
  }

  clearConfirmTimeout = () => {
    if (typeof this._timeout !== "undefined") {
      clearTimeout(this._timeout);
      delete this._timeout;
    }
  }
}


export interface Props extends SpanProps, BoxProps {}

export const EventConfirmBox = (props: Props) => {
  let { event } = props;
  let { className, onConfirm, autoConfirmTimeout, ...boxProps } = props;
  let unconfirmed = event.labels_predicted && !event.labels_confirmed;
  return <Box
    className={classNames(className, {
      "has-predictions": event.labels_predicted,
      unconfirmed,
      hidden: event.hidden
    })}
    {...boxProps}>
      { props.children }
      <EventConfirmSpan
        event={event}
        onConfirm={onConfirm}
        autoConfirmTimeout={autoConfirmTimeout}
      />
    </Box>;
}

export default EventConfirmBox;

