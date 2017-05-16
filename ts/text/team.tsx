import * as React from "react";

// Team settings
export const SettingsHeading = "Settings";
export const CalHeading = "Calendars";
export const CalDescription = "Which calendars should Esper have access to?";
export const OnboardingCalDescription = CalDescription +
  " Don't worry. You can change this later!";

export const SweepHeading = "Agenda Check Defaults";
export const NotificationsHeading = "Notifications";

export const TeamName = "Name";
export const TeamNamePlaceholder = "Leslie Knope";
export const TeamTimezone = "Timezone";

export const DailyAgenda = "Daily Agenda Email";
export const DailyAgendaDescription =
  "An early morning summary of your day. Reminds you which events " +
  "are still a go.";
export const TBEmailNotif = "Agenda Check Emails";
export const TBEmailNotifyDescription =
  "Emails to confirm that an email has an agenda. If someone responds no " +
  "and no one responds yes, then the meeting will be cancelled.";
export const TBSlackNotif =
  "Agenda Check Slack Notifications";
export const TBSlackNotifDescription =
  "Like agenda check emails, but via Slack.";

export const SlackAuthPrompt =
  "You need to connect to Slack to enable Slack notifications";
export const SlackEditPrompt =
  "Change Slack Team";

export function noContentMessage(href: string) {
  return <div className="no-content-msg">
    Missing calendar events? You may need to share your calendar
    with Esper. <a href={href}>
      Go to the settings page to share your calendar.
    </a>
  </div>;
}

export const NoCalsMsg =
  "Please share a calendar with Esper before continuing.";