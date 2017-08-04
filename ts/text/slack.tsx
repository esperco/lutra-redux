import * as React from "react";

export const SlackSetupAction = "Connect to Slack";
export const SkipSlackAction = "Use Esper without Slack";
export const SlackSetupHeading = SlackSetupAction;
export const SlackShortDescription = "Esper works better with Slack.";
export const SlackSetupDescription = <p>
  {SlackShortDescription} Install our Esper bot to respond
  to notifications from wherever you are.
</p>;
