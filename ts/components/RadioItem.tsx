/*
  Uses HTML5 to style a semantically correct radio button that we can style
  from React itself

  <RadioItem checked={true} onChange={}>
    My label text
  </RadioItem>
*/
require("less/components/_radio-buttons.less");
import * as _ from "lodash";
import * as React from "react";
import * as classNames from "classnames";
import { randomString } from "../lib/util";

interface Props {
  className?: string;
  checked?: boolean;
  defaultChecked?: boolean;
  name: string;
  onChange: (value: boolean) => void;
  inputProps?: React.HTMLProps<HTMLInputElement>;
  labelProps?: React.HTMLProps<HTMLLabelElement>;
  color?: string;      // Background color
  background?: string; // Foreground color
}

export class RadioItem extends React.Component<Props, {}> {
  render() {
    let inputProps = _.clone(this.props.inputProps || {});
    inputProps.id = inputProps.id || randomString();
    inputProps.name = this.props.name;
    inputProps.onChange = this.handleChange;
    if (typeof this.props.checked === "undefined") {
      inputProps.defaultChecked = this.props.defaultChecked || false;
    } else {
      inputProps.checked = this.props.checked;
    }

    let { children, ...labelProps } = this.props.labelProps || {
      children: null
    };
    labelProps.htmlFor = inputProps.id;
    labelProps.className = classNames(
      "radio-item",
      this.props.className,
      labelProps.className,
    );

    let outerStyle = this.props.background ?
      { background: this.props.background } : {};
    let innerStyle = this.props.color ? { background: this.props.color } : {};

    return <label {...labelProps}>
      {/* The "real" radio -- gets hidden*/}
      <input type="radio" {...inputProps} />

      {/* Our fake radio button element that we can style */}
      <span className="pseudo-radio" style={outerStyle}>
        <span style={innerStyle} />
      </span>

      <span>{ this.props.children }</span>
    </label>
  }

  // Convert to form event to boolean
  handleChange = (e: React.FormEvent<HTMLInputElement>) => {
    let target = e.target as HTMLInputElement;
    this.props.onChange(target.checked);
  }
}

export default RadioItem;
