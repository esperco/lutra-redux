require("less/components/_team-settings.less");
import * as _ from 'lodash';
import * as React from 'react';
import CheckboxItem from "../components/CheckboxItem";
import delay from '../components/DelayedControl';
import TextInput from "../components/TextInput";
import FeedbackSettings from "../components/FeedbackSettings";
import TimebombSettings from "../components/TimebombSettings";
import TimezoneDropdown from "../components/TimezoneDropdown";
import SlackAuth from "../containers/SlackAuth";
import TeamCalendars from "../containers/TeamCalendars";
import * as Teams from "../handlers/teams";
import * as TeamPrefs from "../handlers/team-prefs";
import { ApiSvc } from "../lib/api";
import * as ApiT from "../lib/apiT";
import { settings as groupSettings } from "../groups.js/paths";
import { manage } from "../lib/paths";
import { NavSvc } from "../lib/routing";
import { ready, StoreData } from '../states/data-status';
import * as Text from "../text/team";
import { LoggedInState, DispatchFn } from './types';

export interface Props {
  teamId: string;
  state: LoggedInState;
  dispatch: DispatchFn;
  Svcs: ApiSvc & NavSvc;
  Conf?: { maxDaysFetch?: number; };
}

type PrefsType = StoreData<ApiT.Preferences>;

// Hash IDs
const calId = "cals";
const agendaId = "agenda";
const feedbackId = "feedback";
const notificationsId = "notifications";

export default class Settings extends React.Component<Props, {}> {
  render() {
    let prefs = this.props.state.teamPreferences[this.props.teamId];
    return <div id="team-settings" className="container">
      <h2>
        { Text.SettingsHeading }
      </h2>
      { this.renderMenu(prefs) }
      { this.renderContent(prefs) }
    </div>;
  }

  renderMenu(prefs: PrefsType) {
    let { feature_flags, groups } = this.props.state.login;

    return <nav className="menu">
      <a href={"#" + calId}>{ Text.CalHeading }</a>

      { feature_flags.tb || (ready(prefs) && prefs.tb) ?
        <a href={"#" + agendaId}>{ Text.AgendaHeading }</a> : null }

      { feature_flags.fb || (ready(prefs) && prefs.fb) ?
        <a href={"#" + feedbackId}>{ Text.FeedbackHeading }</a> : null }

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

  renderContent(prefs: PrefsType) {
    let { children, ...props } = this.props;
    let feature_flags = props.state.login.feature_flags || {};
    return <div className="content">
      <div className="panel">
        <GeneralSettings {...props} prefs={prefs} />
      </div>

      <h3 id={calId}>{ Text.CalHeading }</h3>
      <p className="description">
        { Text.CalDescription }
      </p>
      <div className="panel">
        <TeamCalendars {...props} />
      </div>

      { feature_flags.tb || (ready(prefs) && prefs.tb) ? <div>
        <h3 id={agendaId}>{ Text.AgendaHeading }</h3>
        <div className="panel">
          <TimebombDefaults {...props} prefs={prefs} />
        </div>
      </div> : null }

      { feature_flags.fb || (ready(prefs) && prefs.fb) ? <div>
        <h3 id={feedbackId}>{ Text.FeedbackHeading }</h3>
        <div className="panel">
          <FeedbackDefaults {...props} prefs={prefs} />
        </div>
      </div> : null }

      <h3 id={notificationsId}>{ Text.NotificationsHeading }</h3>
      <div className="panel">
        <Notifications {...props} prefs={prefs} />
      </div>
    </div>;
  }
}


const GeneralSettings = (props: Props & { prefs: PrefsType }) => {
  let prefs = props.prefs;
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


const TimebombDefaults = (props: Props & { prefs: PrefsType }) => {
  let prefs = props.prefs;
  if (! ready(prefs)) {
    return <div>
      <div className="placeholder" />
      <div className="placeholder" />
      <div className="placeholder" />
    </div>;
  }

  return <TimebombSettings
    value={{
      enabled: !!prefs.tb,
      minGuests: prefs.tb_guests_min,
      maxGuests: prefs.tb_guests_max,
      recurring: prefs.tb_recurring,
      sameDomain: prefs.tb_same_domain
    }}
    onChange={(val) =>  TeamPrefs.update(props.teamId, {
      tb: val.enabled,
      tb_guests_min: val.minGuests,
      tb_guests_max: val.maxGuests,
      tb_recurring: val.recurring,
      tb_same_domain: val.sameDomain
    }, props)}
  />;
}


const FeedbackDefaults = (props: Props & { prefs: PrefsType }) => {
  let prefs = props.prefs;
  if (! ready(prefs)) {
    return <div>
      <div className="placeholder" />
      <div className="placeholder" />
      <div className="placeholder" />
    </div>;
  }

  return <FeedbackSettings
    value={{
      enabled: !!prefs.fb,
      minGuests: prefs.fb_guests_min,
      maxGuests: prefs.fb_guests_max,
      recurring: prefs.fb_recurring,
      sameDomain: prefs.fb_same_domain
    }}
    onChange={(val) => TeamPrefs.update(props.teamId, {
      fb: val.enabled,
      fb_guests_min: val.minGuests,
      fb_guests_max: val.maxGuests,
      fb_recurring: val.recurring,
      fb_same_domain: val.sameDomain
    }, props)}
  />;
}


const Notifications = (props: Props & { prefs: PrefsType }) => {
  let prefs = props.prefs;
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