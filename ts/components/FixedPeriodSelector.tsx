/*
  A calendar range selector that selects a period of a fixed length after
  one click.
*/
import * as React from "react";
import {
  GenericPeriod, Period,
  index, toDays, bounds, add
} from "../lib/period";
import Dropdown from "./Dropdown";
import Icon from "./Icon";
import { DaySelector } from "./CalendarSelectors";
import { fmtPeriod, Today } from "../text/periods";

interface Props {
  value: GenericPeriod;
  onChange: (period: Period<"day">) => void;
}

export class FixedPeriodSelector extends React.Component<Props, {}> {
  _dropdown: Dropdown;

  render() {
    let start = bounds(this.props.value)[0];
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
        menu={<div className="dropdown-menu period-selector-menu">
          <DaySelector
            value={start}
            onChange={this.change}
          />
          { this.renderPresets() }
        </div>}
      />

      <button onClick={() => this.incr(1)}>
        <Icon type="next" />
      </button>
    </div>;
  }

  renderPresets() {
    return <div className="presets panel">
      <button onClick={() => this.change(new Date())}>
        { Today }
      </button>
    </div>;
  }

  incr(i: number) {
    this.props.onChange(add(toDays(this.props.value), i));
  }

  change = (date: Date) => {
    let days = toDays(this.props.value);
    let numDays = days.end - days.start;
    let start = index(date, "day");
    let period: Period<"day"> = {
      interval: "day",
      start, end: start + numDays
    }

    if (this._dropdown) {
      this._dropdown.close();
    }
    this.props.onChange(period);
  }
}

export default FixedPeriodSelector;