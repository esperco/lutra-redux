/*
  Redux-aware component for calendar management
*/

import * as React from "react";
import TeamCalendarsSelector from "../components/TeamCalendarsSelector";
import * as TeamCals from "../handlers/team-cals";
import { ApiSvc } from "../lib/api";
import {
  TeamCalendarState,
  TeamCalendarUpdateAction
} from "../states/team-cals";
import { TeamPreferencesState } from "../states/team-preferences";
import { ready } from "../states/data-status";
import {
  UpdateAction as TeamPreferencesUpdateAction
} from "../states/team-preferences";

export interface Props {
  teamId: string;
  state: TeamCalendarState & TeamPreferencesState;
  dispatch: (a: TeamCalendarUpdateAction|TeamPreferencesUpdateAction) => any;
  Svcs: ApiSvc;
}

export const TeamCalendars = (props: Props) => {
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

export default TeamCalendars;