/*
  Calendar setup page for onboarding
*/

require("less/components/_onboarding.less");
import * as React from "react";
import Tooltip from "../components/Tooltip";
import { NavSvc } from "../lib/routing";
import { ready } from "../states/data-status";
import * as CommonText from "../text/common";
import { DataState } from "../states/data-status";
import * as Text from "../text/team";
import TeamCalendars, { Props as BaseProps } from "./TeamCalendars";

export type Props = BaseProps & {
  next: string;
  state: DataState;
  Svcs: NavSvc;
}

export const CalSetup = (props: Props) => {
  let teamCals = props.state.teamCalendars[props.teamId];
  let hasCals = !!teamCals &&
    ready(teamCals.selected) &&
    teamCals.selected.length > 0;
  let isSaving = !!Object.keys(props.state.apiCalls);

  return <div className="container onboarding">
    <h2>{ Text.CalHeading }</h2>
    <p className="description">
      { Text.OnboardingCalDescription }
    </p>

    <div className="panel">
      <TeamCalendars {...props} />
    </div>

    <div className="onboarding-footer">
      { hasCals && !isSaving ?
        <NextButton onClick={
          () => props.Svcs.Nav.go(props.next)
        } /> :
        <Tooltip
          target={<span><NextButton disabled /></span>}
          title={Text.NoCalsMsg}
        />
      }
    </div>
  </div>;
};

const NextButton = (p: React.HTMLProps<HTMLButtonElement>) => {
  let { children, ...props } = p;
  return <button className="primary cta" {...props}>
    { CommonText.Next }
  </button>;
}

export default CalSetup;