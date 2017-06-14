require("less/components/_team-settings.less");
import * as _ from 'lodash';
import * as React from 'react';
import CheckboxItem from "../components/CheckboxItem";
import delay from '../components/DelayedControl';
import TeamCalendarsSelector from "../components/TeamCalendarsSelector";
import TextInput from "../components/TextInput";
import FeedbackSettings from "../components/FeedbackSettings";
import TimebombSettings from "../components/TimebombSettings";
import TimezoneDropdown from "../components/TimezoneDropdown";
import * as Teams from "../handlers/teams";
import * as TeamCals from "../handlers/team-cals";
import * as TeamPrefs from "../handlers/team-prefs";
import { ApiSvc } from "../lib/api";
import { settings as groupSettings } from "../groups.js/paths";
import { manage } from "../lib/paths";
import { NavSvc } from "../lib/routing";
import { ready } from '../states/data-status';
import * as Text from "../text/team";
import SlackAuth from "./SlackAuth";
import { LoggedInState, DispatchFn } from './types';

export interface Props {
  teamId: string;
  state: LoggedInState;
  dispatch: DispatchFn;
  Svcs: ApiSvc & NavSvc;
  Conf?: { maxDaysFetch?: number; };
}

// Hash IDs
const calId = "cals";
const agendaId = "agenda";
const feedbackId = "feedback";
const notificationsId = "notifications";

export default class Settings extends React.Component<Props, {}> {
  render() {
    return <div id="team-settings" className="container">
      <h2>
        { Text.SettingsHeading }
      </h2>
      { this.renderMenu() }
      { this.renderContent() }
    </div>;
  }

  renderMenu() {
    let { feature_flags, groups } = this.props.state.login;

    return <nav className="menu">
      <a href={"#" + calId}>{ Text.CalHeading }</a>
      <a href={"#" + agendaId}>{ Text.AgendaHeading }</a>
      <a href={"#" + feedbackId}>{ Text.FeedbackHeading }</a>
      <a href={"#" + notificationsId}>{ Text.NotificationsHeading }</a>

      { feature_flags.team_charts ?
        <a href={manage.href({})}>{ Text.TeamChartsSettingsLink }</a> :
        null }

      { feature_flags.group_charts && groups.length ?
        <a href={groupSettings.href({ groupId: groups[0] })}>
          { Text.GroupChartsSettingsLink }
        </a> : null }
    </nav>;
  }

  renderContent() {
    let { children, ...props } = this.props;
    return <div className="content">
      <div className="panel">
        <GeneralSettings {...props} />
      </div>

      <h3 id={calId}>{ Text.CalHeading }</h3>
      <p className="description">
        { Text.CalDescription }
      </p>
      <div className="panel">
        <CalendarsSelector {...props} />
      </div>

      <h3 id={agendaId}>{ Text.AgendaHeading }</h3>
      <div className="panel">
        <TimebombDefaults {...props} />
      </div>

      <h3 id={feedbackId}>{ Text.FeedbackHeading }</h3>
      <div className="panel">
        <FeedbackDefaults {...props} />
      </div>

      <h3 id={notificationsId}>{ Text.NotificationsHeading }</h3>
      <div className="panel">
        <Notifications {...props} />
      </div>
    </div>;
  }
}


const GeneralSettings = (props: Props) => {
  let prefs = props.state.teamPreferences[props.teamId];
  let team = _.find(props.state.login.teams, (t) => t.teamid === props.teamId);

  if (! ready(prefs)) {
    return <div>
      <div className="placeholder" />
      <div className="placeholder" />
    </div>;
  }

  return <div>
    <div className="form-row">
      <label htmlFor="group-name">
        { Text.TeamName }
      </label>
      { delay({
        value: team ? team.team_name : "",
        onChange: (value: string) =>
          Teams.renameTeam(props.teamId, value, props),
        component: (props) => <TextInput
          { ...props}
          id="team-name"
          placeholder={Text.TeamNamePlaceholder}
        />
      }) }
    </div>

    <div className="form-row">
      <label htmlFor="group-timezone">
        { Text.TeamTimezone }
      </label>
      <TimezoneDropdown
        value={prefs.general.current_timezone}
        onChange={(z) => TeamPrefs.update(props.teamId, {
          general: { current_timezone: z }
        }, props)}
      />
    </div>
  </div>;
}


export const CalendarsSelector = (props: Props) => {
  let calState = props.state.teamCalendars[props.teamId] || {};
  let { available, selected } = calState;
  if (! ready(available) || !ready(selected)) {
    return <div>
      <div className="placeholder" />
      <div className="placeholder" />
      <div className="placeholder" />
    </div>;
  }

  return <div>
    <TeamCalendarsSelector
      available={available}
      selected={selected}
      onChange={(cal, value) => TeamCals.toggleCalendar({
        teamId: props.teamId,
        cal, value
      }, props)}
    />
  </div>;
};


const TimebombDefaults = (props: Props) => {
  let prefs = props.state.teamPreferences[props.teamId];
  if (! ready(prefs)) {
    return <div>
      <div className="placeholder" />
      <div className="placeholder" />
      <div className="placeholder" />
    </div>;
  }

  let value = {
    enabled: !!prefs.tb,
    minGuests: prefs.tb_guests_min,
    maxGuests: prefs.tb_guests_max,
    recurring: prefs.tb_recurring,
    sameDomain: prefs.tb_same_domain
  };

  // Add slight delay to give timebomb user enough time to change
  // recurring option or domain option after hitting default
  return delay({
    delay: 2000,
    value,
    onChange: (val) => TeamPrefs.update(props.teamId, {
      tb: val.enabled,
      tb_guests_min: val.minGuests,
      tb_guests_max: val.maxGuests,
      tb_recurring: val.recurring,
      tb_same_domain: val.sameDomain
    }, props),
    component: ({ onSubmit, ...props }) => <TimebombSettings {...props} />
  });
}


const FeedbackDefaults = (props: Props) => {
  let prefs = props.state.teamPreferences[props.teamId];
  if (! ready(prefs)) {
    return <div>
      <div className="placeholder" />
      <div className="placeholder" />
      <div className="placeholder" />
    </div>;
  }

  let value = {
    enabled: !!prefs.fb,
    minGuests: prefs.fb_guests_min,
    maxGuests: prefs.fb_guests_max,
    recurring: prefs.fb_recurring,
    sameDomain: prefs.fb_same_domain
  };

  // Add slight delay to give timebomb user enough time to change
  // recurring option or domain option after hitting default
  return delay({
    delay: 2000,
    value,
    onChange: (val) => TeamPrefs.update(props.teamId, {
      fb: val.enabled,
      fb_guests_min: val.minGuests,
      fb_guests_max: val.maxGuests,
      fb_recurring: val.recurring,
      fb_same_domain: val.sameDomain
    }, props),
    component: ({ onSubmit, ...props }) => <FeedbackSettings {...props} />
  });
}


const Notifications = (props: Props) => {
  let prefs = props.state.teamPreferences[props.teamId];
  if (! ready(prefs)) {
    return <div>
      <div className="placeholder" />
    </div>;
  }

  let dailyAgendaActive = _.includes(
    prefs.email_types.daily_agenda.recipients,
    props.state.login.email);

  return <div>
    <div className="menu panel">
      <CheckboxItem
          checked={dailyAgendaActive}
          onChange={(v) => TeamPrefs.toggleDailyAgenda(props.teamId, v, props)}>
        { Text.DailyAgenda }
        <div className="description">
          { Text.DailyAgendaDescription }
        </div>
      </CheckboxItem>
      <CheckboxItem
          checked={prefs.tb_allow_email_notif}
          onChange={(v) => TeamPrefs.update(props.teamId, {
            tb_allow_email_notif: v
          }, props)}>
        { Text.TBEmailNotif }
        <div className="description">
          { Text.TBEmailNotifyDescription }
        </div>
      </CheckboxItem>
      <CheckboxItem
          checked={!!prefs.slack_address && prefs.tb_allow_slack_notif}
          onChange={(v) => TeamPrefs.ensureSlack(props.teamId, {
            tb_allow_slack_notif: v
          }, props)}>
        { Text.TBSlackNotif }
        <div className="description">
          { Text.TBSlackNotifDescription }
        </div>
      </CheckboxItem>
      <CheckboxItem
          checked={prefs.fb_allow_email_notif}
          onChange={(v) => TeamPrefs.update(props.teamId, {
            fb_allow_email_notif: v
          }, props)}>
        { Text.FBEmailNotif }
        <div className="description">
          { Text.FBEmailNotifyDescription }
        </div>
      </CheckboxItem>
      <CheckboxItem
          checked={!!prefs.slack_address && prefs.fb_allow_slack_notif}
          onChange={(v) => TeamPrefs.ensureSlack(props.teamId, {
            fb_allow_slack_notif: v
          }, props)}>
        { Text.FBSlackNotif }
        <div className="description">
          { Text.FBSlackNotifDescription }
        </div>
      </CheckboxItem>
    </div>

    <div style={{textAlign: "center"}}>
      {/* Mirror email notifs for Slack if no explicit user action */}
      <SlackAuth className="cta secondary"
        teamId={props.teamId} deps={props}
        tb={!!prefs.tb_allow_email_notif}
        fb={!!prefs.fb_allow_email_notif}>
        { !!prefs.slack_address ? Text.SlackEditPrompt : Text.SlackAuthPrompt }
      </SlackAuth>
    </div>
  </div>;
}