/*
  Uses HTML5 to style a semantically correct checkbox that we can style
  from React itself

  <CheckboxItem checked={true} onChange={}>
    My label text
  </CheckboxItem>
*/
import * as _ from "lodash";
import * as React from "react";
import * as classNames from "classnames";
import { randomString } from "../lib/util";

interface Props {
  className?: string;
  checked?: boolean;
  defaultChecked?: boolean;
  onChange: (value: boolean) => void;
  inputProps?: React.HTMLProps<HTMLInputElement>;
  labelProps?: React.HTMLProps<HTMLLabelElement>;
  background?: string;
  color?: string;
  children?: JSX.Element|JSX.Element[]|string;
}

export class CheckboxItem extends React.Component<Props, {}> {
  _ref: HTMLInputElement;

  render() {
    let inputProps = _.clone(this.props.inputProps || {});
    inputProps.id = inputProps.id || randomString();
    inputProps.onChange = this.handleChange;
    if (typeof this.props.checked === "undefined") {
      inputProps.defaultChecked = this.props.defaultChecked || false;
    } else {
      inputProps.checked = this.props.checked;
    }

    let labelProps = _.clone(this.props.labelProps || {});
    labelProps.htmlFor = inputProps.id;
    labelProps.className = classNames(
      "checkbox-item",
      this.props.className,
      labelProps.className,
    );

    let style: React.CSSProperties = {};
    if (this.props.color) { style.color = this.props.color; }
    if (this.props.background) { style.background = this.props.background; }

    return <label {...labelProps}>
      {/* The "real" checkbox -- gets hidden*/}
      <input
        type="checkbox" {...inputProps}
        ref={(c) => this._ref = c}
      />

      {/* Our fake checkbox element that we can style */}
      <span className="pseudo-checkbox" style={style} />

      <span>{ this.props.children }</span>
    </label>
  }

  // Convert to form event to boolean
  handleChange = (e: React.FormEvent<HTMLInputElement>) => {
    let target = e.target as HTMLInputElement;
    this.props.onChange(target.checked);
  }

  val = () => {
    return this._ref && this._ref.checked;
  }
}

export default CheckboxItem;
