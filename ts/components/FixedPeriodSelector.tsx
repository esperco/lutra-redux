/*
  A calendar range selector that selects a period of a fixed length after
  one click.
*/

require("less/components/_period-selectors.less");
import * as React from "react";
import {
  GenericPeriod, Period, dateForDay,
  index, toDays, bounds, add
} from "../lib/period";
import Dropdown from "./Dropdown";
import Icon from "./Icon";
import { DaySelector } from "./CalendarSelectors";
import { fmtPeriod, Today, Earliest } from "../text/periods";

interface Props {
  value: GenericPeriod;
  onChange: (period: Period<"day">) => void;

  // Inclusive, day index
  minIndex?: number;
  maxIndex?: number;
}

export class FixedPeriodSelector extends React.Component<Props, {}> {
  _dropdown: Dropdown;

  render() {
    let start = bounds(this.props.value)[0];
    let { minIndex, maxIndex } = this.props;
    let days = toDays(this.props.value);
    let disablePrev = !!(minIndex && days.start <= minIndex);
    let disableNext = !!(maxIndex && days.end >= maxIndex);
    return <div className="period-selector">
      <button disabled={disablePrev} onClick={() => this.incr(-1)}>
        <Icon type="previous" />
      </button>

      <Dropdown
        ref={(c) => this._dropdown = c}
        keepOpen={true}
        toggle={<button>
          <Icon type="calendar" />
          { fmtPeriod(this.props.value) }
          <Icon type="caret-down" />
        </button>}
        menu={<div className="dropdown-menu period-selector-menu">
          <DaySelector
            value={start}
            onChange={this.change}
            minDate={minIndex ? dateForDay(minIndex) : undefined}
            maxDate={maxIndex ? dateForDay(maxIndex) : undefined}
          />
          { this.renderPresets() }
        </div>}
      />

      <button disabled={disableNext} onClick={() => this.incr(1)}>
        <Icon type="next" />
      </button>
    </div>;
  }

  renderPresets() {
    let date = new Date();
    let label = Today;
    if (this.props.minIndex && index(date, "day") < this.props.minIndex) {
      date = dateForDay(this.props.minIndex);
      label = Earliest;
    }
    return <div className="presets panel">
      <button onClick={() => this.change(date)}>
        { label }
      </button>
    </div>;
  }

  incr(i: number) {
    let days = toDays(this.props.value);
    let next = add(days, i);
    if (this.props.minIndex && next.start < this.props.minIndex) {
      next.start = this.props.minIndex;
      next.end = next.start + (days.end - days.start);
    }
    else if (this.props.maxIndex && next.end > this.props.maxIndex) {
      next.end = this.props.maxIndex;
      next.start = next.end - (days.end - days.start);
    }
    this.props.onChange(next);
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