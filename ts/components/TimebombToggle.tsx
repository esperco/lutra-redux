/*
  Toggle to switch event from move-to-email from confirm.
*/

require("less/components/_timebomb-toggle.less");
import * as moment from "moment";
import * as React from "react";
import Icon from "./Icon";
import CheckboxItem from "./CheckboxItem";
import RadioItem from "./RadioItem";
import Tooltip from "./Tooltip";
import * as ApiT from "../lib/apiT";
import { hasTag, randomString } from "../lib/util";
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
  _name: string;

  constructor(props: Props) {
    super(props);
    this._name = randomString();
  }

  render() {
    let { event } = this.props;
    if (! event.timebomb) {
      return null;
    }

    if (hasTag("Stage2", event.timebomb)) {
      let ret: JSX.Element;

      // Stage 2 canceled
      if (event.timebomb[1] === "Event_canceled") {
        ret = <div className="alert warning">
          { Text.Canceled }
        </div>;
      }

      // Stage 2 confirmed (or not reaction)
      else {
        return null; // Don't show confirmed status for now,
                     // same as if no timebomb at all
      }

      return <TimebombContainer>
        { ret }
      </TimebombContainer>;
    }

    else if (hasTag("Stage1", event.timebomb)) {
      let value: boolean|null = null;
      if (_.includes(event.timebomb[1].confirmed_list,
                     this.props.loggedInUid)) {
        value = true;
      } else if (_.includes(event.timebomb[1].rejected_list,
                            this.props.loggedInUid)) {
        value = false;
      }
      console.info(event.id,
        event.timebomb[1].confirmed_list,
        event.timebomb[1].rejected_list,
        this.props.loggedInUid,
        value
      );
      let disabled =
        moment(event.timebomb[1].confirm_by).isSameOrBefore(new Date());
      return <TimebombContainer
              disabledMsg={disabled ? Text.ConfirmLate : undefined}>
        <TimebombOptions
          disabled={disabled}
          name={this._name || (event.id + "-timebomb")}
          value={value}
          onChange={(val) => this.props.onToggle(event.id, val)}
        />
        <HelpLink />
      </TimebombContainer>;
    }

    else {
      let active = event.timebomb[1].set_timebomb;
      let disabled =
        moment(event.timebomb[1].set_by).isSameOrBefore(new Date());
      return <TimebombContainer
              disabledMsg={disabled ? Text.TimebombLate : undefined}>
        <div className="options">
          <CheckboxItem
          inputProps={{ disabled }}
          checked={active}
          onChange={(val) => this.props.onToggle(event.id, val)}>
            { Text.SetTimebomb }
          </CheckboxItem>
        </div>
        <HelpLink />
      </TimebombContainer>;
    }
  }
}

export const HelpLink =
  () => <a className="help-link" href={helpPath} target="_blank">
    <Icon type="help">{ Text.HelpLink }</Icon>
  </a>;


interface OptionProps {
  name: string;
  disabled?: boolean;
  value: boolean|null;
  onChange: (val: boolean) => void;
}

function TimebombOptions({ name, disabled, value, onChange }: OptionProps) {
  return <div className="options">
    <RadioItem name={name}
    inputProps={{ disabled }}
    checked={value === true}
    onChange={(val) => onChange(val)}>
      { Text.ConfirmYes }
    </RadioItem>
    <RadioItem name={name}
    inputProps={{ disabled }}
    checked={value === false}
    onChange={(val) => onChange(!val)}>
      { Text.ConfirmNo }
    </RadioItem>
  </div>;
}

export const BaseTimebombToggle =
  (props: OptionProps) => <TimebombContainer>
    <TimebombOptions {...props} />
  </TimebombContainer>;

function TimebombContainer({ disabledMsg, children }:{
  disabledMsg?: string;
  children?: JSX.Element[];
}) {
  let ret = <div className="timebomb-toggle">
    { children }
  </div>;
  return disabledMsg ? <Tooltip
    target={ret}
    title={disabledMsg}
  /> : ret;
}

export default TimebombToggle;