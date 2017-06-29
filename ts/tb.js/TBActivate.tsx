/*
  Page with button to activate agenda check
*/

require("less/components/_onboarding.less");
import * as _ from "lodash";
import * as React from "react";
import * as TeamPrefs from "../handlers/team-prefs"
import { ApiSvc } from "../lib/api";
import { NavSvc } from "../lib/routing";
import { Loading } from "../text/data-status";
import * as PrefsState from "../states/team-preferences";
import * as Text from "../text/timebomb";
import * as Paths from "./paths";
import { LoggedInState } from "./types";

interface Props extends React.HTMLProps<HTMLButtonElement> {
  teamId: string;
  dispatch: (action: PrefsState.UpdateAction) => any;
  state: LoggedInState;
  Svcs: ApiSvc & NavSvc;
}

export const TBActivate = (props: Props) => {
  let isSaving = !_.isEmpty(props.state.apiCalls);
  return <div className="container onboarding">
    <h2>{ Text.ActivateHeading }</h2>
    <div className="description">
      { Text.ActivateDescription }
    </div>

    <div className="onboarding-footer">
      <button
        className="primary cta"
        disabled={isSaving}
        onClick={() => next(props)}
      >
        { isSaving ? Loading : Text.ActivateCTA }
      </button>
    </div>
  </div>;
};

const next = async ({ teamId, ...deps }: Props) => {
  await TeamPrefs.autosetTimebomb(teamId, deps);
  deps.Svcs.Nav.go(Paths.events.href({}));
};

export default TBActivate;