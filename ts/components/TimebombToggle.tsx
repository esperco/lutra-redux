/*
  Toggle to switch event from move-to-email from confirm.
*/

require("less/components/_timebomb-toggle.less");
import * as moment from "moment";
import * as React from "react";
import Icon from "./Icon";
import RadioItem from "./RadioItem";
import Tooltip from "./Tooltip";
import * as ApiT from "../lib/apiT";
import { hasTag } from "../lib/util";
import * as Text from "../text/timebomb";
import { base as helpPath } from "../sweep.js/paths";
import * as _ from "lodash";

interface Props {
  loggedInUid: string|undefined;
  event: ApiT.GenericCalendarEvent;

  // true -> set timebomb (move to email), false -> unset (in person)
  onToggle: (eventId: string, value: boolean) => void;
}

export class TimebombToggle extends React.Component<Props, {}> {
  constructor(props: Props) {
    super(props);
  }

  render() {
    let { event } = this.props;
    if (! event.timebomb) {
      return null;
    }

    if (hasTag("Stage2", event.timebomb)) {
      let ret: JSX.Element;

      // Stage 2 confirmed
      if (event.timebomb[1] === "Event_confirmed") {
        return null; // Don't show confirmed status for now,
                     // same as if no timebomb at all
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

    else {
      let name = event.id + "-timebomb";
      let active = hasTag("Stage0" , event.timebomb) ?
        event.timebomb[1].set_timebomb :
        !_.includes(event.timebomb[1].confirmed_list, this.props.loggedInUid);
      let disabled = hasTag("Stage0", event.timebomb) ?
        moment(event.timebomb[1].set_by).isSameOrBefore(new Date()) :
        moment(event.timebomb[1].confirm_by).isSameOrBefore(new Date());
      let ret = <TimebombContainer>
        <h4>
          { Text.TimebombHeader }
          <a href={helpPath} target="_blank">
            <Icon type="help" />
          </a>
        </h4>
        <TimebombOptions
          disabled={disabled}
          name={name}
          value={active}
          onChange={(val) => this.props.onToggle(event.id, val)}
        />
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
  }
}


interface OptionProps {
  name: string;
  disabled?: boolean;
  value: boolean;
  onChange: (val: boolean) => void;
}

function TimebombOptions({ name, disabled, value, onChange }: OptionProps) {
  return <div className="options">
    <RadioItem name={name}
    inputProps={{ disabled }}
    checked={!value}
    onChange={(val) => onChange(!val)}>
      { Text.TimebombOff }
    </RadioItem>
    <RadioItem name={name}
    inputProps={{ disabled }}
    checked={value}
    onChange={(val) => onChange(val)}>
      { Text.TimebombOn }
    </RadioItem>
  </div>;
}

export const BaseTimebombToggle =
  (props: OptionProps) => <TimebombContainer>
    <TimebombOptions {...props} />
  </TimebombContainer>;

function TimebombContainer({ children }:{ children?: JSX.Element[] }) {
  return <div className="timebomb-toggle">
    { children }
  </div>;
}

export default TimebombToggle;