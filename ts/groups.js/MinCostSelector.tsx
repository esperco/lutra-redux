import * as _ from 'lodash';
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
    let value = _.isNumber(this.props.value) ? this.props.value : MIN_COST;
    return <div className="min-cost-selector">
      { _.map(_.range(MIN_COST, MAX_COST + 1), (n) =>
        <RadioItem key={n} name={name}
          checked={value === n}
          className={value === n ? "active" : ""}
          onChange={(v) => v && this.props.onChange(n)}
        >
          { _.repeat("$", n) }
        </RadioItem> )}
    </div>;
  }
}

export default MinCostSelector;
