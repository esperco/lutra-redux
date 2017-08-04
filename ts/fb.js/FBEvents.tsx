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
import * as Text from "../text/feedback";
import * as Slack from "../text/slack";
import FBEventList from "./FBEventList";
import FBEventEditor from "./FBEventEditor";
import * as Paths from "./paths";
import { LoggedInState as StoreState, DispatchFn } from './types';

export interface Props {
  teamId: string;
  period: GenericPeriod;
  eventId?: string;
  state: StoreState;
  dispatch: DispatchFn;
  Svcs: ApiSvc & NavSvc;
  Conf?: { maxDaysFetch?: number; };
}

export default class FBEvents extends React.Component<Props, {}> {
  render() {
    let { eventId, ...baseProps } = this.props;
    let minIndex = index(new Date(), "day");
    return <div id="fb-events" className={classNames("sidebar-layout", {
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
                      { Text.FBExpiredShort }
                    </Icon></span>}
                    title={Text.FBExpiredLong}
                  /></div>
                </div> : null }

              <FBEventList
                eventHrefFn={this.eventHref}
                onFeedbackToggle={this.feedbackToggle}
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
        <FBEventEditor
          {...this.props}
          onFeedbackToggle={this.feedbackToggle}
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
          { !!prefs.fb ? <Text.DefaultDescriptionSetup
            settingsHref={settingsHref}
            minGuests={prefs.fb_guests_min}
            maxGuests={prefs.fb_guests_max}
            recurring={prefs.fb_recurring}
            sameDomain={prefs.fb_same_domain}
          /> : <Text.FBSettingsMsg settingsHref={settingsHref} /> }
        </div>

        { !(prefs.fb_allow_slack_notif && prefs.slack_address) ?
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

  feedbackToggle = (eventId: string,
    value: boolean,
    forceInstance?: boolean
  ) => {
    Events.toggleFeedback({
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
