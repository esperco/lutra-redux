import * as React from "react";

// Team settings
export const SettingsHeading = "Settings";
export const CalHeading = "Calendars";
export const CalDescription = "Which calendars should Esper have access to?";
export const OnboardingCalDescription = CalDescription +
  " Don't worry. You can change this later!";
export const MiscHeading = "Miscellaneous";

export const TeamName = "Name";
export const TeamNamePlaceholder = "Leslie Knope";
export const TeamTimezone = "Timezone";

export const DailyAgenda = "Daily Agenda Email";
export const DailyAgendaDescription =
  "An early morning summary of your day. Reminds you which events " +
  "are still a go."

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