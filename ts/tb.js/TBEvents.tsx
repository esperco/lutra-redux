/*
  Main events view
*/
require("less/components/_event-messages.less");
import * as classNames from "classnames";
import * as React from 'react';
import Icon from "../components/Icon";
import FixedPeriodSelector from "../components/FixedPeriodSelector";
import ScrollContainer from "../components/ScrollContainer";
import Tooltip from "../components/Tooltip";
import SlackAuth from "../containers/SlackAuth";
import * as Events from "../handlers/events";
import { ApiSvc } from "../lib/api";
import * as ApiT from "../lib/apiT";
import { settings } from "../lib/paths";
import { GenericPeriod, index } from "../lib/period";
import { NavSvc } from "../lib/routing";
import { ready } from "../states/data-status";
import * as Slack from "../text/slack";
import {
  TBSettingsMsg,
  DefaultDescriptionSetup,
  TBTooSoonShort, TBTooSoonLong
} from "../text/timebomb";
import TBEventList from "./TBEventList";
import TBEventEditor from "./TBEventEditor";
import * as Paths from "./paths";
import { LoggedInState as StoreState, DispatchFn } from './types';

export interface Props {
  teamId: string;
  period: GenericPeriod;
  eventId?: string;
  state: StoreState;
  dispatch: DispatchFn;
  Svcs: ApiSvc & NavSvc;
  Conf?: { maxDaysFetch?: number; tbMinIncr?: number; };
}

export default class TBEvents extends React.Component<Props, {}> {
  render() {
    let { eventId, ...baseProps } = this.props;
    let { Conf } = this.props;
    let minIndex = index(new Date(), "day") + ((Conf && Conf.tbMinIncr) || 0);
    return <div id="tb-events" className={classNames("sidebar-layout", {
      "show-right": !!eventId
    })}>
      {/* Main Content Area */}
      <div className="content">
        <div className="rowbar-layout">
          <header>
            {/* Select which period to show events for */}
            <FixedPeriodSelector
              value={this.props.period}
              onChange={this.periodChange}
              minIndex={minIndex}
            />
          </header>

          <ScrollContainer
            className="content"
            scrollKey={this.props.period.start}
            onScrollChange={(direction) => this.props.dispatch({
              type: "SCROLL", direction
            })}>
            <div className="container">
              { this.props.period.start <= minIndex ?
                <div className="event-messages">
                  { this.renderPrefsMsg() }
                  <div className="timeline-info"><Tooltip
                    target={<span><Icon type="info">
                      { TBTooSoonShort }
                    </Icon></span>}
                    title={TBTooSoonLong}
                  /></div>
                </div> : null }

              <TBEventList
                eventHrefFn={this.eventHref}
                onTimebombToggle={this.timebombToggle}
                onPeriodChange={this.periodChange}
                {...baseProps}
              />
            </div>
          </ScrollContainer>
        </div>
        <a className="backdrop" href={this.eventHref()} />
      </div>

      {/* Sidebar, if applicable  */}
      <div className="sidebar panel">
        <button className="close-btn"
                onClick={() => this.props.Svcs.Nav.go(this.eventHref())}>
          <Icon type="close" />
        </button>
        <TBEventEditor
          {...this.props}
          onTimebombToggle={this.timebombToggle}
        />
      </div>
    </div>;
  }

  renderPrefsMsg() {
    let prefs = this.props.state.teamPreferences[this.props.teamId];
    if (ready(prefs)) {
      let settingsHref = settings.href({});
      return <div>
        <div className="alert info">
          { !!prefs.tb ? <DefaultDescriptionSetup
            settingsHref={settingsHref}
            minGuests={prefs.tb_guests_min}
            maxGuests={prefs.tb_guests_max}
            recurring={prefs.tb_recurring}
            sameDomain={prefs.tb_same_domain}
          /> : <TBSettingsMsg settingsHref={settingsHref} /> }
        </div>

        { !(prefs.tb_allow_slack_notif && prefs.slack_address) ?
          <div className="alert info">
            <span>{ Slack.SlackShortDescription }</span>
            <SlackAuth
              teamId={this.props.teamId}
              fb={true}
              deps={this.props}
            />
          </div> : null }
      </div>;
    }

    else if (prefs === "FETCHING") {
      return <div className="placeholder" />;
    }

    return null;
  }

  timebombToggle = (eventId: string,
    value: boolean, forceInstance?: boolean
  ) => {
    Events.toggleTimebomb({
      calgroupId: this.props.teamId,
      calgroupType: "team",
      eventId,
      value
    }, this.props, { forceInstance });
  }

  periodChange = (period: GenericPeriod) => {
    this.props.Svcs.Nav.go(Paths.events.href({ period }));
  }

  eventHref = (event?: ApiT.GenericCalendarEvent) => Paths.events.href({
    period: this.props.period,
    eventId: event && event.id
  });
}
