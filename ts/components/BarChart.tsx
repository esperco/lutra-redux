/*
  A simple HTML-only horizontal bar chart -- goes from high to low
*/
import * as _ from 'lodash';
import * as React from 'react';
import Tooltip from "./Tooltip";
import { randomString, roundStr } from "../lib/util";

export interface Value {
  id: string;
  displayAs: string|JSX.Element;
  color?: string;
  value: number;
}

export interface Props {
  values: Value[];
  sorted?: boolean; // Values already sorted in descending order?

  // Formats numeric value for display (e.g. convert seconds to hours)
  fmtValue: (v: Value) => string|JSX.Element;
  tooltip?: (v: Value) => string;
}

export class BarChart extends React.Component<Props, {}> {
  render() {
    let { values } = this.props;
    values = this.props.sorted ? values : _.sortBy(values, (v) => -v.value);

    let maxValue = values[0] && values[0].value;
    return <div className="bar-chart">
      { _.map(values, (v) => this.renderRow(v, maxValue) )}
    </div>;
  }

  renderRow(value: Value, maxValue: number) {
    let width = roundStr(100 * value.value/maxValue, 1) + "%";
    let style = { width, background: value.color };
    return <div className="row" key={value.id || randomString()}>
      <div className="name">{ value.displayAs }</div>
      <div className="value">
        <Tooltip
          target={<span className="bar" style={style} />}
          title={ this.props.tooltip ?
                  this.props.tooltip(value) :
                  value.value.toString() } />
        <span className="number">
          { this.props.fmtValue(value) }
        </span>
      </div>
    </div>;
  }
}

export default BarChart;