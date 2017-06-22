import * as _ from "lodash";
import * as React from "react";
import Tooltip from "../components/Tooltip";
import TeamCalendars from "../containers/TeamCalendars";
import { ApiSvc } from "../lib/api";
import { NavSvc } from "../lib/routing";
import { ready } from "../states/data-status";
import * as CommonText from "../text/common";
import * as PrefsState from "../states/team-preferences";
import * as Text from "../text/team";
import * as Paths from "./paths";
import { LoggedInState } from "./types";

interface Props extends React.HTMLProps<HTMLButtonElement> {
  teamId: string;
  dispatch: (action: PrefsState.UpdateAction) => any;
  state: LoggedInState;
  Svcs: ApiSvc & NavSvc;
}

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
      <TeamCalendars {...props} />
    </div>

    <div className="onboarding-footer">
      { hasCals && !isSaving ?
        <NextButton onClick={
          () => props.Svcs.Nav.go(Paths.activate.href({}))
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

export default TBCalSetup;