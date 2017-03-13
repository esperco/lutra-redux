/*
  Main events view
*/

import * as React from 'react';
import FixedPeriodSelector from "../components/FixedPeriodSelector";
import ScrollContainer from "../components/ScrollContainer";
import * as Events from "../handlers/events";
import { ApiSvc } from "../lib/api";
import { GenericPeriod } from "../lib/period";
import { NavSvc } from "../lib/routing";
import { noContentMessage } from "../text/team";
import TBEventsList from "./TBEventList";
import * as Paths from "./paths";
import { State as StoreState, DispatchFn } from './types';

export interface Props {
  teamId: string;
  period: GenericPeriod;
  state: StoreState;
  dispatch: DispatchFn;
  Svcs: ApiSvc & NavSvc;
  Conf?: { maxDaysFetch?: number; };
}

export default class TBEventList extends React.Component<Props, {}> {
  render() {
    return <div id="tb-events" className="rowbar-layout">
      <header>
        {/* Select which period to show events for */}
        <FixedPeriodSelector
          value={this.props.period}
          onChange={this.periodChange}
        />
      </header>

      <ScrollContainer
        className="content"
        onScrollChange={(direction) => this.props.dispatch({
          type: "SCROLL", direction
        })}>
        <div className="container">
          <TBEventsList
            noContentMessage={noContentMessage(Paths.settings.href({}))}
            onTimebombToggle={this.timebombToggle}
            onPeriodChange={this.periodChange}
            {...this.props}
          />
        </div>
      </ScrollContainer>
    </div>;
  }

  timebombToggle = (eventId: string, value: boolean) => {
    Events.toggleTimebomb({
      calgroupId: this.props.teamId,
      calgroupType: "team",
      eventId,
      value
    }, this.props);
  }

  periodChange = (period: GenericPeriod) => {
    this.props.Svcs.Nav.go(Paths.events.href({ period }));
  }
}
