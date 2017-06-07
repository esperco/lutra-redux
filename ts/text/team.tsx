import * as React from "react";

// Team settings (/tb)
export const SettingsHeading = "Settings";
export const CalHeading = "Calendars";
export const CalDescription = "Which calendars should Esper have access to?";
export const OnboardingCalDescription = CalDescription +
  " Don't worry. You can change this later!";

export const AgendaHeading = "Agenda Check Defaults";
export const FeedbackHeading = "Feedback and Ratings Defaults";
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
  "Emails that ask if you have anything to discuss at a meeting.";
export const TBSlackNotif =
  "Agenda Check Slack Notifications";
export const TBSlackNotifDescription =
  "Like agenda check emails, but via Slack.";
export const FBEmailNotif = "Meeting Feedback Emails";
export const FBEmailNotifyDescription =
  "Emails asking for feedback after a meeting, plus a summary of " +
  "the feedback if you're organizer.";
export const FBSlackNotif =
  "Meeting Feedback Slack Notifications";
export const FBSlackNotifDescription =
  "Like meeting feedback emails, but via Slack.";

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
