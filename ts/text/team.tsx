import * as React from "react";

// Team settings
export const SettingsHeading = "Settings";
export const CalHeading = "Calendars";
export const CalDescription = "Which calendars should Esper have access to?";
export const OnboardingCalDescription = CalDescription +
  " Don't worry. You can change this later!";

export const SweepHeading = "Sweep Defaults";
export const NotificationsHeading = "Notifications";

export const TeamName = "Name";
export const TeamNamePlaceholder = "Leslie Knope";
export const TeamTimezone = "Timezone";

export const DailyAgenda = "Daily Agenda Email";
export const DailyAgendaDescription =
  "An early morning summary of your day. Reminds you which events " +
  "are still a go.";
export const TBEmailNotif = "Sweep Email Notifications";
export const TBEmailNotifyDescription =
  "Emails for meeting confirmation requests and cancellations. " +
  "Sweep will still remove unconfirmed meetings from your calendar " +
  "even if you have opted out of all notifications. You can always " +
  "confirm which meetings to confirm or cancel on esper.com.";
export const TBSlackNotif =
  "Sweep Slack Notifications";
export const TBSlackNotifDescription =
  "Like Sweep email notifications, but via Slack.";

export const SlackOn = <span>	&#x2714; Connected to Slack</span>;
export const SlackOff = <span>
  You need to connect to Slack to enable Slack notifications
</span>;
export const SlackAuthPrompt = "Connect to Slack";
export const SlackEditPrompt = "Change Slack Team";

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