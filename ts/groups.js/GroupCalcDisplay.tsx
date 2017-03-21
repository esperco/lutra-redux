/*
  Display list of stats for group
*/

require("less/components/_calc-display.less");
import * as _ from 'lodash';
import * as React from 'react';
import BarChart from "../components/BarChart";
import Tooltip from "../components/Tooltip";
import TreeFall from "../components/TreeFall";
import * as ApiT from "../lib/apiT";
import { LabelSet } from "../lib/event-labels";
import { ready, StoreData } from "../states/data-status";
import { CalcResults } from "../states/group-calcs";
import * as CommonText from "../text/common";
import * as EventText from "../text/events";


interface Props {
  labels: LabelSet;
  labelHrefFn?: (l?: ApiT.LabelInfo) => string;
  results?: StoreData<CalcResults>;
}

/*
    Active if user scrolls to see stats. We hide stats until user
    scrolls to make visible because if user has scrolled past chart
    already, we don't want the screen to jump if charts renders into
    something particularly long.
  */
export class GroupCalcDisplay extends TreeFall<Props, {}> {
  constructor(props: Props) {
    super(props);
  }

  render() {
    let { results } = this.props;
    if (!ready(results)) {
      return <div className="calc-display">
        { CommonText.Calculating }
        { this.renderWaypoint() }
      </div>;
    }

    return <div className="calc-display">
      <Stats results={results} />
      { _.isEmpty(results.labelResults) ? null :
        <LabelChart {...this.props} results={results} /> }
      { this.renderWaypoint() }
    </div>;
  }
}

export function Stats({ results } : { results: CalcResults }) {
  return <div className="stats">
    <Tooltip
      target={<span>
        <span className="value">
          { results.eventCount }
        </span>
        <span className="unit">
          { EventText.events(results.eventCount) }
        </span>
      </span>}
      title={EventText.CalcEventsDescription} />

    <Tooltip
      target={<span>
        <EventText.FmtHours hours={EventText.toHours(results.seconds)} />
        <span className="unit">
          { EventText.hours(EventText.toHours(results.seconds)) }
        </span>
      </span>}
      title={EventText.CalcHoursDescription} />

    <Tooltip
      target={<span>
        <EventText.FmtHours hours={EventText.toHours(results.peopleSeconds)} />
        <span className="unit">
          { EventText.peopleHours(EventText.toHours(results.peopleSeconds)) }
        </span>
      </span>}
      title={EventText.CalcPeopleHoursDescription} />

    <Tooltip
      target={<span className="active">
        <EventText.FmtHours
          hours={EventText.toHours(results.groupPeopleSeconds)} />
        <span className="unit">
          { EventText.groupPeopleHours(
            EventText.toHours(results.groupPeopleSeconds)
          ) }
        </span>
      </span>}
      title={EventText.CalcGroupPeopleHoursDescription} />
  </div>;
}

export function LabelChart({ results, labels, labelHrefFn } : {
  results: CalcResults;
  labels: LabelSet;
  labelHrefFn?: (l?: ApiT.LabelInfo) => string;
}) {
  let values = _.map(results.labelResults, (data, normalized) => {
    let label = normalized ? labels.getByKey(normalized) : undefined;
    let displayAs: string|JSX.Element = "";
    if (label) {
      displayAs = labelHrefFn ?
        <a href={labelHrefFn(label)}>{label.original}</a> :
        label.original;
    }
    return {
      id: normalized || "",
      displayAs,
      value: data.groupPeopleSeconds,
      color: label && label.color
    };
  });
  values = _.sortBy(values, (v) => -v.value);

  return <div className="label-chart">
    <h3>{ EventText.PeopleHoursByLabelTitle }</h3>
    <BarChart
      values={values}
      sorted={true}
      sortMax={Math.max(
        values[0] ? values[0].value : 0,
        results.unlabeledResult.groupPeopleSeconds
      )}
      fmtValue={(v) => {
        let hours = EventText.toHours(v.value);
        let pct = v.value / results.groupPeopleSeconds;
        return <EventText.FmtHoursPct hours={hours} pct={pct} />;
      }}
    />
  </div>;
}

export default GroupCalcDisplay;