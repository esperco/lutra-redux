/*
  FB-specific wrapper around standard event list
*/
require("less/components/_event-list-container.less");
import * as React from 'react';
import { InlineInfo, Box, Title } from "../components/EventInfo";
import EventList from "../components/EventList";
import { EventDataList } from "../components/QueryDay";
import QueryDayList from "../components/QueryDayList";
import FeedbackToggle from "../components/FeedbackToggle";
import { ApiSvc } from "../lib/api";
import * as ApiT from "../lib/apiT";
import { canTogglePref } from "../lib/feedback";
import { settings } from "../lib/paths";
import { GenericPeriod, add } from "../lib/period";
import { NavSvc } from "../lib/routing";
import { MoreEvents } from "../text/events";
import { noContentMessage } from "../text/team";
import { LoggedInState as StoreState } from './types';

interface Props {
  teamId: string;
  period: GenericPeriod;
  eventHrefFn?: (ev: ApiT.GenericCalendarEvent) => string;
  onPeriodChange: (p: GenericPeriod) => void;
  onFeedbackToggle: (eventId: string, val: boolean) => void;
  state: StoreState;
  Svcs: ApiSvc & NavSvc;
  Conf?: { maxDaysFetch?: number; };
}

export default class FBEventList extends React.Component<Props, {}> {
  render() {
    let { teamId: calgroupId, state, period } = this.props;
    return <div className="event-list-container">
      <QueryDayList
        maxDays={this.props.Conf && this.props.Conf.maxDaysFetch}
        calgroupId={calgroupId}
        period={period}
        state={state}
        query={{}}
        cb={this.renderEventList}
        filter={canTogglePref}
        onLoadPrefix={(total) => total ? null :
          noContentMessage(settings.href({}))}
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
    return <Box key={event.id} event={event} className="panel">
      <div>
        <h4><Title
          event={event}
          href={this.props.eventHrefFn && this.props.eventHrefFn(event)}
        /></h4>
        <InlineInfo event={event} />
      </div>
      <FeedbackToggle
        event={event}
        onToggle={(val) => this.props.onFeedbackToggle(event.id, val)} />
    </Box>;
  }

  next = () => this.props.onPeriodChange(add(this.props.period, 1));
}
