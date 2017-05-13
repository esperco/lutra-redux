require("less/components/_slack-setup.less");
import * as React from "react";
import SlackAuth from "./SlackAuth";
import * as TBText from "../text/timebomb";
import * as Paths from "./paths";
import { Props } from "./TBSettings";

export const TBSlackSetup =
  (p: Props) => <div id="slack-setup">
    <div className="container">
      <h2>
        { TBText.SlackSetupHeading }
      </h2>
      { TBText.SlackSetupDescription }

      <div className="slack-setup-actions">
        <div>
          <SlackAuth teamId={p.teamId} deps={p} />
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
