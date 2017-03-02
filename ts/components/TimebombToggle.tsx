/*
  Toggle to switch event from move-to-email from confirm.
*/
import * as moment from "moment";
import * as React from "react";
import Icon from "./Icon";
import Modal from "./Modal";
import RadioItem from "./RadioItem";
import SlideShow from "./TimebombSlideshow";
import Tooltip from "./Tooltip";
import * as ApiT from "../lib/apiT";
import { hasTag } from "../lib/util";
import * as Text from "../text/timebomb";

interface Props {
  event: ApiT.GenericCalendarEvent;

  // true -> set timebomb (move to email), false -> unset (in person)
  onToggle: (eventId: string, value: boolean) => void;
}

export class TimebombToggle extends React.Component<Props, {
  showHelpModal: boolean;
}> {
  constructor(props: Props) {
    super(props);
    this.state = { showHelpModal: false };
  }

  componentWillReceiveProps(newProps: Props) {
    if (newProps.event.id !== this.props.event.id) {
      this.setState({ showHelpModal: false });
    }
  }

  render() {
    let { event } = this.props;
    if (! event.timebomb) {
      return null;
    }

    if (hasTag("Stage0", event.timebomb)) {
      let name = event.id + "-timebomb";
      let active = event.timebomb[1].set_timebomb;
      let disabled = moment(event.timebomb[1].set_by)
        .isSameOrBefore(new Date());
      let ret = <TimebombContainer>
        <h4>
          { Text.TimebombHeader }
          <button onClick={() => this.setState({ showHelpModal: true })}>
            <Icon type="help" />
          </button>
        </h4>
        { this.state.showHelpModal ?
          this.renderHelpModal() : null }
        <div className="options">
          <RadioItem name={name}
          inputProps={{ disabled }}
          checked={!active}
          onChange={(val) => this.props.onToggle(event.id, !val)}>
            { Text.TimebombOff }
          </RadioItem>
          <RadioItem name={name}
          inputProps={{ disabled }}
          checked={active}
          onChange={(val) => this.props.onToggle(event.id, val)}>
            { Text.TimebombOn }
          </RadioItem>
        </div>
      </TimebombContainer>;

      if (disabled) {
        return <Tooltip
          target={ret}
          title={Text.TimebombLate}
        />
      } else {
        return ret;
      }
    }

    else {
      let ret: JSX.Element;

      if (hasTag("Stage1", event.timebomb)) {
        ret = <div className="alert info">
          { Text.PendingConfirmation }
        </div>;
      }

      // Stage 2 confirmed
      else if (event.timebomb[1] === "Event_confirmed") {
        ret = <div className="alert success">
          { Text.Confirmed }
        </div>;
      }

      // Stage 2 canceled
      else {
        ret = <div className="alert warning">
          { Text.Canceled }
        </div>;
      }

      return <TimebombContainer>
        { ret }
      </TimebombContainer>;
    }
  }

  renderHelpModal() {
    return <Modal header={Text.TimebombHelpHeader}
        onClose={() => this.setState({ showHelpModal: false })}>
      <div className="panel">
        <SlideShow />
      </div>
    </Modal>;
  }
}

function TimebombContainer({ children }:{ children?: JSX.Element[] }) {
  return <div className="timebomb-toggle">
    { children }
  </div>;
}

export default TimebombToggle;