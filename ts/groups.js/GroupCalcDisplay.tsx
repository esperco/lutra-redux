import * as React from 'react';
import { ready, StoreData } from "../states/data-status";
import { CalcResults } from "../states/group-calcs";
import * as CommonText from "../text/common";
import * as EventText from "../text/events";

interface Props {
  results?: StoreData<CalcResults>;
}

export class GroupCalcDisplay extends React.Component<Props, {}> {
  render() {
    let { results } = this.props;
    if (! ready(results)) {
      return <div className="calc-display">
        { CommonText.Calculating }
      </div>;
    }

    return <div className="calc-display">
      <span>
        <span className="value">
          { results.eventCount }
        </span>
        <span className="unit">
          { EventText.events(results.eventCount) }
        </span>
      </span>

      <span>
        <EventText.FmtHours hours={EventText.toHours(results.seconds)} />
        <span className="unit">
          { EventText.hours(EventText.toHours(results.seconds)) }
        </span>
      </span>

      <span>
        <EventText.FmtHours hours={EventText.toHours(results.peopleSeconds)} />
        <span className="unit">
          { EventText.peopleHours(EventText.toHours(results.peopleSeconds)) }
        </span>
      </span>
    </div>;
  }
}

export default GroupCalcDisplay;