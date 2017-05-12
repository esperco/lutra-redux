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
import { ready } from "../states/data-status";
import { noContentMessage } from "../text/team";
import { TBSettingsMsg, DefaultDescriptionSetup } from "../text/timebomb";
import TBEventsList from "./TBEventList";
import * as Paths from "./paths";
import { State as StoreState, DispatchFn } from './types';

export interface BaseProps {
  teamId: string;
  period: GenericPeriod;
  state: StoreState;
  dispatch: DispatchFn;
  Svcs: ApiSvc & NavSvc;
  Conf?: { maxDaysFetch?: number; };
}

interface Props extends BaseProps {
  onboarding: boolean;
}

export default class TBEventList extends React.Component<Props, {}> {
  render() {
    let { onboarding, ...baseProps } = this.props;
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
        scrollKey={this.props.period.start}
        onScrollChange={(direction) => this.props.dispatch({
          type: "SCROLL", direction
        })}>
        <div className="container">
          { onboarding ? this.renderOnboardingMsg() : null }

          <TBEventsList
            noContentMessage={noContentMessage(Paths.settings.href({}))}
            onTimebombToggle={this.timebombToggle}
            onPeriodChange={this.periodChange}
            {...baseProps}
          />
        </div>
      </ScrollContainer>
    </div>;
  }

  renderOnboardingMsg() {
    let prefs = this.props.state.teamPreferences[this.props.teamId];
    if (ready(prefs)) {
      let settingsHref = Paths.settings.href({});
      return <div className="alert info">
        { !!prefs.tb ? <DefaultDescriptionSetup
          settingsHref={settingsHref}
          minGuests={prefs.tb_guests_min}
          maxGuests={prefs.tb_guests_max}
          recurring={prefs.tb_recurring}
          sameDomain={prefs.tb_same_domain}
        /> : <TBSettingsMsg settingsHref={settingsHref} /> }
      </div>;
    }
    return <div className="placeholder" />;
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
