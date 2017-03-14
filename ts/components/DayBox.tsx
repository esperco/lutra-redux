/*
  A React component for a thing tied to a day in a list view
*/

require("less/components/_day-box.less");
import * as React from "react";
import * as moment from "moment";
import * as classNames from "classnames";

export default function DayBox({ date, children } : {
  date: Date;
  children?: JSX.Element|JSX.Element[]|string
}) {
  let m = moment(date);
  let today = new Date();
  return <div className={classNames("day-box", {
    past:   m.isBefore(today, 'day'),
    today:  m.isSame(today, 'day'),
  })}>
    <h3 className="day-title">
      <span className="month">
        { m.format("MMM") }
      </span>
      <span className="day-of-month">
        { m.format("D") }
      </span>
      <span className="day-of-week">
        { m.format("ddd") }
      </span>
    </h3>
    { children }
  </div>;
}