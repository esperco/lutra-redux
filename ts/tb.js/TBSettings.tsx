import * as _ from 'lodash';
import * as React from 'react';
import CheckboxItem from "../components/CheckboxItem";
import delay from '../components/DelayedControl';
import TeamCalendarsSelector from "../components/TeamCalendarsSelector";
import TextInput from "../components/TextInput";
import { TimebombSettings } from "../components/TimebombSettings";
import TimezoneDropdown from "../components/TimezoneDropdown";
import * as Teams from "../handlers/teams";
import * as TeamCals from "../handlers/team-cals";
import * as TeamPrefs from "../handlers/team-prefs";
import { ApiSvc } from "../lib/api";
import { ready } from '../states/data-status';
import * as Text from "../text/team";
import { LoggedInState, DispatchFn } from './types';

interface Props {
  teamId: string;
  onboarding?: boolean;
  state: LoggedInState;
  dispatch: DispatchFn;
  Svcs: ApiSvc;
  Conf?: { maxDaysFetch?: number; };
}

export default class TBSettings extends React.Component<Props, {}> {
  render() {
    return <div className="container">
      <div className="panel">
        <GeneralSettings {...this.props} />
      </div>

      <div className="panel">
        <CalendarsSelector {...this.props} />
      </div>

      <div className="panel">
        <TimebombDefaults {...this.props} />
      </div>

      <div className="panel">
        <Notifications {...this.props} />
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


const CalendarsSelector = (props: Props) => {
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

  let enabled = props.onboarding ?
    (typeof prefs.tb === "undefined" ? true : !!prefs.tb) :
    !! prefs.tb;
  let val = {
    enabled,
    minGuests: prefs.tb_guests_min,
    maxGuests: prefs.tb_guests_max
  };

  return <TimebombSettings
    value={val}
    onChange={(val) => TeamPrefs.update(props.teamId, {
      tb: val.enabled,
      tb_guests_min: val.minGuests,
      tb_guests_max: val.maxGuests
    }, props)}
  />;
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

  return <div className="menu">
    <CheckboxItem
        checked={dailyAgendaActive}
        onChange={(v) => TeamPrefs.toggleDailyAgenda(props.teamId, v, props)}>
      { Text.DailyAgenda }
      <div className="description">
        { Text.DailyAgendaDescription }
      </div>
    </CheckboxItem>
  </div>;
}