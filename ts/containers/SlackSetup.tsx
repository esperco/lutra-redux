require("less/components/_slack-setup.less");
import * as React from "react";
import * as Text from "../text/slack";
import SlackAuth, { Deps } from "./SlackAuth";

interface Props extends Deps {
  className?: string;
  teamId: string;
  next: string;
}

export const TBSlackSetup = ({ teamId, next, className, ...deps } : Props) =>
  <div id="slack-setup" className={className}>
    <div className="container">
      <h2>
        { Text.SlackSetupHeading }
      </h2>
      { Text.SlackSetupDescription }

      <div className="slack-setup-actions">
        <div>
          <SlackAuth teamId={teamId} deps={deps} tb={true} />
        </div>
        <div>
          <a href={next}>
            { Text.SkipSlackAction }
          </a>
        </div>
      </div>
    </div>
  </div>;

export default TBSlackSetup;
