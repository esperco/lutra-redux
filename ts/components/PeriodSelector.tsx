/*
  A calendar range selector that lets us increment by fixed intervals
*/
import * as React from "react";
import { Period, fromDates, bounds, add } from "../lib/period";
import Dropdown from "./Dropdown";
import Icon from "./Icon";
import { RangeSelector } from "./CalendarSelectors";
import { fmtPeriod } from "../text/periods";

interface Props {
  value: Period;
  onChange: (period: Period) => void;
}

export class PeriodSelector extends React.Component<Props, {}> {
  _dropdown: Dropdown;

  render() {
    let [start, end] = bounds(this.props.value);

    return <div className="period-selector">
      <button onClick={() => this.incr(-1)}>
        <Icon type="previous" />
      </button>

      <Dropdown
        ref={(c) => this._dropdown = c}
        keepOpen={true}
        toggle={<button>
          { fmtPeriod(this.props.value) }
        </button>}
        menu={<div className="dropdown-menu">
          <RangeSelector
            value={[start, end]}
            initialView={start}
            onChange={(range) => this.change(
              fromDates(range[0], range[1])
            )}
          />
        </div>}
      />

      <button onClick={() => this.incr(1)}>
        <Icon type="next" />
      </button>
    </div>;
  }

  incr(i: number) {
    this.change(add(this.props.value, i));
  }

  change(period: Period) {
    if (this._dropdown) {
      this._dropdown.close();
    }
    this.props.onChange(period);
  }
}

export default PeriodSelector;