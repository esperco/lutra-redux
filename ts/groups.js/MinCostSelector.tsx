/*
  Component for selecting min cost ($$$$) for event filtering
*/

require("less/components/_min-cost.less");
import { range } from 'lodash';
import * as React from 'react';
import RadioItem from '../components/RadioItem';
import { randomString } from '../lib/util';

const MIN_COST = 1;
const MAX_COST = 5;

export interface Props {
  value?: number; // Default to MIN_COST
  onChange: (value: number) => void;
}

export class MinCostSelector extends React.Component<Props, {}> {
  render() {
    let name = randomString();
    let value = typeof this.props.value === "number" ?
      this.props.value : MIN_COST;
    return <div className="min-cost-selector">
      { range(MIN_COST, MAX_COST + 1).map((n) =>
        <RadioItem key={n} name={name}
          checked={value === n}
          className={value === n ? "active" : ""}
          onChange={(v) => v && this.props.onChange(n)}
        >
          { "$".repeat(n) }
        </RadioItem> )}
    </div>;
  }
}

export default MinCostSelector;
