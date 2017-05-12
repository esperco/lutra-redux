import * as _ from "lodash";
import * as React from "react";
import Tooltip from "../components/Tooltip";
import { ready } from "../states/data-status";
import * as CommonText from "../text/common";
import * as Text from "../text/team";
import * as Paths from "./paths";
import { Props, CalendarsSelector } from "./TBSettings";

export const TBCalSetup = (props: Props) => {
  let teamCals = props.state.teamCalendars[props.teamId];
  let hasCals = !!teamCals &&
    ready(teamCals.selected) &&
    teamCals.selected.length > 0;
  let isSaving = !_.isEmpty(props.state.apiCalls);

  return <div className="container onboarding">
    <h2>{ Text.CalHeading }</h2>
    <p className="description">
      { Text.OnboardingCalDescription }
    </p>

    <div className="panel">
      <CalendarsSelector {...props} />
    </div>

    <div className="onboarding-footer">
      { hasCals && !isSaving ?
        <NextButton onClick={
          () => props.Svcs.Nav.go(Paths.pickEventSetup.href({}))
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
  return <button className="primary" {...props}>
    { CommonText.Next }
  </button>;
}

export default TBCalSetup;