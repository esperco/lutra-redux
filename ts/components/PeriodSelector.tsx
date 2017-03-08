/*
  A calendar range selector that lets us increment by fixed intervals
*/
import * as _ from "lodash";
import * as React from "react";
import { GenericPeriod, fromDates, bounds, add } from "../lib/period";
import Dropdown from "./Dropdown";
import Icon from "./Icon";
import { RangeSelector } from "./CalendarSelectors";
import { fmtPeriod, PeriodSelectorText } from "../text/periods";

interface Preset {
  displayAs: string|JSX.Element;
  value: GenericPeriod;
}

interface Props {
  value: GenericPeriod;
  presets?: Preset[]
  onChange: (period: GenericPeriod) => void;
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
          <Icon type="calendar" />
          { fmtPeriod(this.props.value) }
          <Icon type="caret-down" />
        </button>}
        menu={<div className="dropdown-menu period-selector-menu">
          <div className="description panel">{ PeriodSelectorText }</div>
          <RangeSelector
            value={[start, end]}
            initialView={start}
            onChange={(range) => this.change(
              fromDates(range[0], range[1])
            )}
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
    if (this.props.presets) {
      return <div className="presets panel">
        { _.map(this.props.presets, (d, i) => <button key={i}
          className={_.isEqual(d.value, this.props.value) ? "active" : ""}
          onClick={() => this.change(d.value)}>
            { d.displayAs }
          </button>) }
      </div>;
    }
    return null;
  }

  incr(i: number) {
    this.change(add(this.props.value, i));
  }

  change(period: GenericPeriod) {
    if (this._dropdown) {
      this._dropdown.close();
    }
    this.props.onChange(period);
  }
}

export default PeriodSelector;