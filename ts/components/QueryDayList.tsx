/*
  A list of QueryDays. Contains further optimizations to only load
  a fixed number of events until we scroll such that events are visible.
*/

import * as _ from "lodash";
import * as React from "react";
import { iter } from "../lib/event-query-iter";
import { stringify, QueryFilter } from "../lib/event-queries";
import { GenericPeriod, toDays } from "../lib/period";
import { EventsState } from "../states/events";
import { Loading } from "../text/data-status";
import QueryDay, { QueryDayCB } from "./QueryDay";
import Waypoint from "./Waypoint";

export interface Props extends React.HTMLAttributes<HTMLDivElement> {
  calgroupId: string;
  period: GenericPeriod;
  query: QueryFilter;
  state: EventsState;
  cb: QueryDayCB;

  // Max number of days to show on each scroll
  maxDays?: number;

  // When everthing is loaded, show this *before* queryDay content -- gets
  // passed total number of events processed
  onLoadPrefix?: (total: number) => React.ReactNode|React.ReactNode[];

  // Same, but after
  onLoadSuffix?: (total: number) => React.ReactNode|React.ReactNode[];
}

interface State {
  daysToShow: number;
}
export class QueryDayList extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { daysToShow: this.getDaysIncr() };
  }

  componentWillReceiveProps(nextProps: Props) {
    if (! _.isEqual(this.props.period, nextProps.period) ||
        ! _.isEqual(this.props.query, nextProps.query) ||
        ! _.isEqual(this.props.calgroupId, nextProps.calgroupId)) {
      this.setState({ daysToShow: this.getDaysIncr() });
    }
  }

  getDaysIncr() {
    return this.props.maxDays || Infinity;
  }

  render() {
    let {
      calgroupId,
      period,
      query,
      state: storeState,
      cb,
      maxDays,
      onLoadPrefix,
      onLoadSuffix,
      ...divProps
    } = this.props;
    let queryState = storeState.eventQueries[calgroupId] || [];
    let eventMap = storeState.events[calgroupId] || {};
    let queryKey = stringify(query);

    let { start, end } = toDays(period);
    let total = 0;
    let loaded = iter(this.props, storeState, () => { total += 1; });

    // Only show more if we're not busy fetching stuff
    let endToShow = Math.min(start + this.state.daysToShow - 1, end);
    let canShowMore = loaded && endToShow < end;
    let queryDays = queryState.slice(start, endToShow + 1);

    return <div {...divProps}>
      { loaded && onLoadPrefix ? onLoadPrefix(total) : null }

      { queryDays.map((d, i) =>
        <QueryDay key={i} day={start + i}
          result={d[queryKey]}
          eventMap={eventMap}
          cb={cb}
        />) }

      { /* Use different key so it re-updates if nothing new in update */
        canShowMore ? <div className="loading-msg">
          <Waypoint key={endToShow} onEnter={this.showMore} />
          { Loading }
        </div> : null }

      { loaded && onLoadSuffix && !canShowMore ? onLoadSuffix(total) : null }
    </div>;
  }

  showMore = () => {
    let incr = this.props.maxDays;
    if (incr) {
      this.setState({
        daysToShow: this.state.daysToShow + this.getDaysIncr()
      });
    }
  }
}

export default QueryDayList;