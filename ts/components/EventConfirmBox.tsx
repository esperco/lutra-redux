/*
  A variant of the Event Box with Waypoints to do auto-confirmation when
  a user scrolls down to it. Also adds additional event-related classes
  to box such as hidden status and confirmation status.
*/

require("less/components/_event-info.less");
import * as React from "react";
import { Box, BoxProps } from "../components/EventInfo";
import Waypoint from "./Waypoint";
import * as classNames from "classnames";

// Viewing event in list will confirm its labels after this time in ms
const DEFAULT_AUTO_CONFIRM_TIMEOUT = 3000;

export interface Props extends BoxProps {
  onConfirm: () => void;
  autoConfirmTimeout?: number;
}

export class EventConfirmBox extends React.Component<Props, {}> {
  _timeout?: number;

  // Don't fire confirmation timeout if we skipped past it really fast
  componentWillUnmount() {
    if (typeof this._timeout !== "undefined") {
      clearTimeout(this._timeout);
    }
  }

  render() {
    let { event } = this.props;
    let { className, onConfirm, autoConfirmTimeout, ...props } = this.props;
    let unconfirmed = event.labels_predicted && !event.labels_confirmed;
    return <Box
      className={classNames(className, {
        "has-predictions": event.labels_predicted,
        unconfirmed,
        hidden: event.hidden
      })}
      {...props}>
        { this.props.children }
        { !event.labels_confirmed ?
          <span className="confirm-waypoint">
            <Waypoint
              fireOnRapidScroll={false}
              onEnter={this.setConfirmTimeout}
              onLeave={this.clearConfirmTimeout}
            />
          </span> : null }
      </Box>;
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

export default EventConfirmBox;

