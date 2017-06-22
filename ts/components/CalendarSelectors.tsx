/*
  Components for selecting time periods
*/
require("less/components/_calendar.less");
import * as _ from "lodash";
import * as React from "react";
import * as moment from "moment";
import * as classNames from "classnames";
import Icon from "./Icon";

/* Select a single day */

interface BaseProps {
  // Inclusive
  minDate?: Date;
  maxDate?: Date;
}

interface DaySelectorProps extends BaseProps {
  value?: Date;
  onChange: (date: Date) => void;
}

interface DaySelectorState {
  view: Date;   // Date in currently viewed month
}

abstract class CalSelectorBase<P extends BaseProps, S extends DaySelectorState>
    extends React.Component<P, S>
{
  render() {
    let weeks = iterWeeksInMonth(this.state.view,
      (weekStart, weekEnd) => this.renderWeek(weekStart, weekEnd)
    );
    return <div className="calendar calendar-selector">
      <header>
        <button onClick={() => this.incr(-1)} disabled={this.prevDisabled()}>
          <Icon type="previous" />
        </button>
        <h4>{ moment(this.state.view).format("MMM YYYY") }</h4>
        <button onClick={() => this.incr(1)} disabled={this.nextDisabled()}>
          <Icon type="next" />
        </button>
      </header>
      <div className="month">
        <WeekHeadings format="dd" />
        { weeks }
      </div>
    </div>;
  }

  renderWeek(start: Date, end: Date) {
    return <div className="week" key={start.getTime()}>
      { iterDaysInRange(start, end,
        (d) => this.renderDay(d, this.dayDisabled(d))) }
    </div>;
  }

  abstract renderDay(date: Date, disabled: boolean): JSX.Element;

  // Increment view by month
  incr(i: number) {
    this.setState({
      view: moment(this.state.view).clone().add(i, 'month').toDate()
    });
  }

  nextDisabled() {
    let { maxDate } = this.props;
    return !!(
      maxDate &&
      moment(this.state.view).clone().endOf('month').isSameOrAfter(maxDate)
    );
  }

  prevDisabled() {
    let { minDate } = this.props;
    return !!(
      minDate &&
      moment(this.state.view).clone().startOf('month').isSameOrBefore(minDate)
    );
  }

  dayDisabled(thisDate: Date) {
    let minDate = this.props.minDate &&
      moment(this.props.minDate).startOf('day');
    let maxDate = this.props.maxDate &&
      moment(this.props.maxDate).startOf('day');
    let cmpDate = moment(thisDate).startOf('day');
    return !!(
      (minDate && cmpDate.isBefore(minDate)) ||
      (maxDate && cmpDate.isAfter(maxDate))
    );
  }
}

export class DaySelector extends
    CalSelectorBase<DaySelectorProps, DaySelectorState>
{
  constructor(props: DaySelectorProps) {
    super(props);
    this.state = {
      view: props.value || new Date()
    };
  }

  renderDay(date: Date, disabled: boolean) {
    let active = this.props.value &&
      this.props.value.getTime() === date.getTime() &&
      !disabled;
    let classes = classNames("day", {
      start: active,
      end: active,
      active,
      "in-month": moment(date).isSame(this.state.view, "month"),
      today: moment(date).isSame(new Date(), 'day')
    });
    return <button
      key={date.getTime()}
      className={classes}
      disabled={disabled}
      onClick={() => this.props.onChange(date)}>
      { moment(date).format("D") }
    </button>;
  }
}


/* Select a range of days */

interface RangeProps extends BaseProps {
  value?: [Date, Date]; // Current selection, if any
  initialView?: Date;       // Date in currently viewed month
  onChange: (range: [Date, Date]) => void;
}

interface RangeState {
  view: Date;   // Date in currently viewed month
  start?: Date; // If one date is selected and we need an end
  hover?: Date; // The date user is hovering over, if any
}

export class RangeSelector extends
    CalSelectorBase<RangeProps, RangeState>
{
  constructor(props: RangeProps) {
    super(props);
    this.state = {
      view: props.initialView || new Date()
    };
  }

  renderDay(date: Date, disabled: boolean) {
    let activeState = disabled ? null : this.activeState(date);
    let classes = classNames("day", {
      start: activeState === "start",
      active: !!activeState,
      end: activeState === "end",
      "in-month": moment(date).isSame(this.state.view, "month"),
      today: moment(date).isSame(new Date(), 'day')
    });
    return <button
      key={date.getTime()}
      className={classes}
      disabled={disabled}
      onClick={() => this.selectDay(date)}
      onMouseEnter={() => this.enterDay(date)}>
      { moment(date).format("D") }
    </button>;
  }

  selectDay(date: Date) {
    let start = this.state.start;
    if (start && start.getTime() <= date.getTime()) {
      this.setState({ ...this.state, start: undefined });
      this.props.onChange([start, date]);
    } else {
      this.setState({ ...this.state, start: date });
    }
  }

  enterDay(date: Date) {
    this.setState({ ...this.state, hover: date });
  }

  // Disable undefining hover with leaving because this is somewhat visually
  // jarring. But leave in case we want to re-enable later.
  //
  // exitDay(date: Date) {
  //   this.setState({ ...this.state, hover: undefined });
  // }

  activeState(date: Date): "start"|"middle"|"end"|null {
    let mDate = moment(date);

    // Selection mode active?
    if (this.state.start) {
      if (mDate.isSame(this.state.start, 'day')) {
        return "start";
      }

      if (this.state.hover) {
        if (mDate.isSame(this.state.hover, 'day')) {
          return "end";
        }

        if (mDate.isBetween(this.state.start, this.state.hover)) {
          return "middle";
        }
      }
    }

    // Highlight existing selected
    else if (this.props.value) {
      if (mDate.isSame(this.props.value[0], 'day')) {
        return "start";
      }

      else if (mDate.isSame(this.props.value[1], 'day')) {
        return "end";
      }

      else if (mDate.isBetween(
        this.props.value[0],
        this.props.value[1]
      )) {
        return "middle";
      }
    }

    return null;
  }
}

/*
  Iterate over weeks -- calls callback with start and end dates of each week
  that overlaps a month
*/
export function iterWeeksInMonth<T>(
  dateInMonth: Date,
  cb: (start: Date, end: Date) => T
): T[] {
  let start = moment(dateInMonth).clone().startOf('month').startOf('week');
  let end = moment(dateInMonth).clone().endOf('month').endOf('week');
  let ret: T[] = [];
  while (end.diff(start) > 0) {
    ret.push(cb(start.toDate(), start.clone().endOf('week').toDate()));
    start.add(1, 'week');
  }
  return ret;
}

/*
  Iterate over each day in a time period
*/
export function iterDaysInRange<T>(
  start: Date, end: Date,
  cb: (date: Date) => T
): T[] {
  let current = moment(start).clone().startOf('day');
  let endM = moment(end);
  let ret: T[] = [];
  while (endM.diff(current) > 0) {
    ret.push(cb(current.toDate()));
    current.add(1, 'day');
  }
  return ret;
}

/*
  Returns Su, M, Tu, etc.
*/
export function WeekHeadings(props: {
  start?: number;   // Day of week to start on
  end?: number;     // Day of week to end on
  format?: string;  // Format for each date
}) {
  let start = props.start || 0;
  let end = props.end || 6;
  let format = props.format || "ddd";
  return <div className="week-headings">
    { _.map( _.range(start, end + 1), (i) => <div key={i}>
      { moment().weekday(i).format(format) }
    </div> ) }
  </div>;
}

