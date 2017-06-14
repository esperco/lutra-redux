require("less/components/_slack-setup.less");
import * as React from "react";
import { ApiSvc } from "../lib/api";
import { NavSvc } from "../lib/routing";
import SlackAuth from "../settings.js/SlackAuth";
import * as PrefsState from "../states/team-preferences";
import * as TBText from "../text/timebomb";
import * as Paths from "./paths";
import { LoggedInState } from "./types";

interface Props extends React.HTMLProps<HTMLButtonElement> {
  teamId: string;
  dispatch: (action: PrefsState.UpdateAction) => void;
  state: LoggedInState;
  Svcs: ApiSvc & NavSvc;
}

export const TBSlackSetup =
  (p: Props) => <div id="slack-setup">
    <div className="container">
      <h2>
        { TBText.SlackSetupHeading }
      </h2>
      { TBText.SlackSetupDescription }

      <div className="slack-setup-actions">
        <div>
          <SlackAuth teamId={p.teamId} deps={p} tb={true} />
        </div>
        <div>
          <a href={Paths.events.href({ onboarding: true })}>
            { TBText.SkipSlackAction }
          </a>
        </div>
      </div>
    </div>
  </div>;

export default TBSlackSetup;
