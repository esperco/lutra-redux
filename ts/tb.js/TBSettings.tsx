import * as React from 'react';
import TeamCalendarsSelector from "../components/TeamCalendarsSelector";
import * as TeamCals from "../handlers/team-cals";
import { ApiSvc } from "../lib/api";
import * as ApiT from "../lib/apiT";
import { ready } from '../states/data-status';
import { State as StoreState, DispatchFn } from './types';

interface Props {
  team: ApiT.Team;
  onboarding?: boolean;
  state: StoreState;
  dispatch: DispatchFn;
  Svcs: ApiSvc;
  Conf?: { maxDaysFetch?: number; };
}

export default class TBSettings extends React.Component<Props, {}> {
  render() {
    return <div className="container">
      <div className="panel">
        <CalendarsSelector {...this.props} />
      </div>
    </div>;
  }
}

const CalendarsSelector = (props: Props) => {
  let calState = props.state.teamCalendars[props.team.teamid] || {};
  let { available, selected } = calState;
  if (!ready(available) || !ready(selected)) {
    return <div className="spinner" />;
  }

  return <div>
    <TeamCalendarsSelector
      available={available}
      selected={selected}
      onChange={(cal, value) => TeamCals.toggleCalendar({
        teamId: props.team.teamid,
        cal, value
      }, props)}
    />
  </div>;
};