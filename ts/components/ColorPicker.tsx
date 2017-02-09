import * as _ from "lodash";
import * as React from "react";
import { presets, colorForText } from "../lib/colors";
import { randomString } from "../lib/util";

export interface Props {
  value?: string;
  onChange: (color: string) => void;
}

export class ColorPicker extends React.Component<Props, {}> {
  _name: string;

  constructor(props: Props) {
    super(props);
    this._name = randomString();
  }

  render() {
    return <div className="color-picker">
      { _.map(presets, (c) => this.renderOne(c)) }
      <span className="remainder" />
    </div>;
  }

  renderOne(color: string) {
    let id = this._name + "_" + color.replace('#','').replace(' ', '');
    return <label className="color" htmlFor={id}>
      <input
        id={id}
        type="radio"
        name={this._name}
        checked={color === this.props.value}
        onChange={() => this.props.onChange(color)}
      />
      <span className="color-box" style={{
        background: color,
        color: colorForText(color)
      }} />
    </label>;
  }
}

export default ColorPicker;

