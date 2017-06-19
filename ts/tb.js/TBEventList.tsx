/*
  TB-specific wrapper around standard event list -- shared between setup
  and normal home views
*/

import * as React from 'react';
import { InlineInfo, Box, Title } from "../components/EventInfo";
import EventList from "../components/EventList";
import { EventDataList } from "../components/QueryDay";
import QueryDayList from "../components/QueryDayList";
import TimebombToggle from "../components/TimebombToggle";
import { ApiSvc } from "../lib/api";
import * as ApiT from "../lib/apiT";
import { GenericPeriod, add } from "../lib/period";
import { NavSvc } from "../lib/routing";
import { MoreEvents } from "../text/events";
import { LoggedInState as StoreState } from './types';

interface Props {
  teamId: string;
  period: GenericPeriod;
  noContentMessage: JSX.Element|string;
  eventHrefFn?: (ev: ApiT.GenericCalendarEvent) => string;
  onPeriodChange: (p: GenericPeriod) => void;
  onTimebombToggle: (eventId: string, val: boolean) => void;
  state: StoreState;
  Svcs: ApiSvc & NavSvc;
  Conf?: { maxDaysFetch?: number; };
}

export default class TBEventList extends React.Component<Props, {}> {
  render() {
    let { teamId: calgroupId, state, period, noContentMessage } = this.props;
    return <div className="tb-event-list">
      <QueryDayList
        maxDays={this.props.Conf && this.props.Conf.maxDaysFetch}
        calgroupId={calgroupId}
        period={period}
        state={state}
        query={{}}
        cb={this.renderEventList}
        onLoadPrefix={(total) => total ? null : noContentMessage}
      />

      <div className="load-more">
        <button onClick={this.next}>{ MoreEvents }</button>
      </div>
    </div>;
  }

  renderEventList = (events: EventDataList) => {
    return <EventList
      className="panel"
      events={events}
      cb={this.renderEvent}
    />;
  }

  renderEvent = (event: ApiT.GenericCalendarEvent) => {
    let loggedInUid =
      this.props.state.login ? this.props.state.login.uid : undefined;
    return <Box key={event.id} event={event} className="panel">
      <div>
        <h4><Title
          event={event}
          href={this.props.eventHrefFn && this.props.eventHrefFn(event)}
        /></h4>
        <InlineInfo event={event} />
      </div>
      <TimebombToggle
        loggedInUid={loggedInUid}
        event={event}
        onToggle={this.props.onTimebombToggle} />
    </Box>;
  }

  next = () => this.props.onPeriodChange(add(this.props.period, 1));
}
