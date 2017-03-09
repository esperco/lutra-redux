import * as _ from 'lodash';
import * as React from 'react';
import DayBox from "../components/DayBox";
import EventList, { SharedProps } from "../components/EventList";
import FixedPeriodSelector from "../components/FixedPeriodSelector";
import ScrollContainer from "../components/ScrollContainer";
import TreeFall from "../components/TreeFall";
import * as Events from "../handlers/events";
import { ApiSvc } from "../lib/api";
import * as ApiT from "../lib/apiT";
import { iter } from "../lib/event-query-iter";
import { stringify } from "../lib/event-queries";
import { GenericPeriod, toDays, dateForDay, add } from "../lib/period";
import { NavSvc } from "../lib/routing";
import { StoreData } from "../states/data-status";
import { EventMap, QueryResult } from "../states/events";
import * as Text from "../text/common";
import { noContentMessage } from "../text/team";
import * as Paths from "./paths";
import { State as StoreState, DispatchFn } from './types';

interface Props {
  teamId: string;
  period: GenericPeriod;
  state: StoreState;
  dispatch: DispatchFn;
  Svcs: ApiSvc & NavSvc;
  Conf?: { maxDaysFetch?: number; };
}

export default class TBEventList extends React.Component<Props, {}> {
  render() {
    let { teamId: calgroupId, state, period } = this.props;
    let queryState = state.eventQueries[calgroupId] || [];
    let eventMap = state.events[calgroupId] || {};
    let queryKey = stringify({});

    let { start, end } = toDays(period);
    let queryDays = queryState.slice(start, end);
    let loggedInUid =
      this.props.state.login ? this.props.state.login.uid : undefined;

    let total = 0;
    let loaded = iter(
      { ...this.props, calgroupId, query: {} },
      this.props.state,
      () => total += 1
    );

    return <div id="tb-event-list" className="rowbar-layout">
      <header>
        {/* Select which period to show events for */}
        <FixedPeriodSelector
          value={this.props.period}
          onChange={this.onPeriodChange}
        />
      </header>

      <ScrollContainer
        className="content"
        onScrollChange={(direction) => this.props.dispatch({
          type: "SCROLL", direction
        })}>
        <div className="container">
          { loaded && !total ?
            <div>{ noContentMessage(Paths.settings.href({})) }</div> : null }

          { _.map(queryDays, (d, i) =>
            <QueryDay key={i} day={start + i}
              loggedInUid={loggedInUid}
              result={d[queryKey]}
              eventMap={eventMap}
              { ...this.props }
              onTimebombToggle={this.onTimebombToggle}
            />
          ) }

          <div className="load-more">
            <button onClick={
              () => this.onPeriodChange(add(this.props.period, 1))
            }>{ Text.More }</button>
          </div>
        </div>
      </ScrollContainer>
    </div>;
  }

  onTimebombToggle = (eventId: string,
                      value: boolean) =>
  {
    Events.toggleTimebomb({
      calgroupId: this.props.teamId,
      calgroupType: "team",
      eventId,
      value
    }, this.props);
  }

  onPeriodChange = (period: GenericPeriod) => {
    this.props.Svcs.Nav.go(Paths.eventList.href({ period }));
  }
}


interface DayProps extends SharedProps {
  day: number; // Period day index
  loggedInUid?: string;
  result: StoreData<QueryResult>;
  eventMap: EventMap;
}

class QueryDay extends TreeFall<DayProps, {}> {
  render() {
    if (! this.props.result || this.props.result === "FETCH_ERROR") {
      return this.renderEmpty();
    }

    let calEvents: (StoreData<ApiT.GenericCalendarEvent>|undefined)[] =
      this.props.result === "FETCHING" ? ["FETCHING"] :
      _.map(this.props.result.eventIds, (id) => this.props.eventMap[id]);

    if (_.isEmpty(calEvents)) return this.renderEmpty();;

    return <div>
      { this.renderWaypoint() }
      <DayBox date={dateForDay(this.props.day)}>
        {/*
          Wrap EventList with extra div so flexbox doesn't expand height of
          EventList when it's too short.
        */}
        <div><EventList
          events={calEvents}
          {...this.props}
        /></div>
      </DayBox>
      { this.renderWaypoint() }
    </div>;
  }

  /*
    Need to render something (rather than null) if no data so we
    can check visibility when deciding whether to update. Use a span
    (since that shouldn't affect * + * CSS selectors or other spacing)
  */
  renderEmpty() {
    return <span>
      { this.renderWaypoint() }
    </span>;
  }
}
