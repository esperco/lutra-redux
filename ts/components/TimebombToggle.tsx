/*
  Toggle to switch event from move-to-email from confirm.
*/
import * as moment from "moment";
import * as React from "react";
import RadioItem from "./RadioItem";
import Tooltip from "./Tooltip";
import * as ApiT from "../lib/apiT";
import { hasTag } from "../lib/util";
import * as Text from "../text/timebomb";

export class TimebombToggle extends React.Component<{
  event: ApiT.GenericCalendarEvent;

  // true -> set timebomb (move to email), false -> unset (in person)
  onToggle: (eventId: string, value: boolean) => void
}, {}> {

  render() {
    let { event } = this.props;
    if (event.timebomb && hasTag("Stage0", event.timebomb)) {
      let name = event.id + "-timebomb";
      let active = event.timebomb[1].set_timebomb;
      let disabled = moment(event.timebomb[1].set_by)
        .isSameOrBefore(new Date());
      let ret = <div className="timebomb-toggle">
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
      </div>;

      if (disabled) {
        return <Tooltip
          target={ret}
          title={Text.TimebombLate}
        />
      } else {
        return ret;
      }
    }

    // No toggle for other states yet
    return null;
  }
}

export default TimebombToggle;