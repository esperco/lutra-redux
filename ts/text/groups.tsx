import * as _ from 'lodash';
import * as React from 'react';

/*
  Group-specific text
*/
import { GroupRole } from "../lib/apiT";

export const Group = "Enterprise Account";
export const Groups = "Enterprise Accounts";
export const AddMember = "Invite team member";
export const GroupCalendarSharingYes =
  "This user is sharing calendar data.";
export const GroupCalendarSharingNo =
  "This user is not sharing any calendars.";
export const GroupCalendarSharingEdit = "Pick which calendars to share.";
export const GroupDisableCalendarSharing = "Disable Calendar Sharing";

export const CreateGroup = "Create New Team";
export const GroupName = "Team Name";
export const GroupNamePlaceholder = "Guardians of the Galaxy";
export const GroupTimezone = "Timezone";

export const DailyEmail = "Daily Team Summary Email";
export function alertsGoTo(email: string) {
  return <span>
    These alerts will go to <strong>{email}</strong>
  </span>;
}

export const RemoveGroupHeading = "Deactivate " + Group;
export const RemoveGroupBtn = "Deactivate";
export function removeGroupDescription(group?: string) {
  return `Deactivate ${group || "this " + Group}? This will remove all ` +
         `tags and related data.`;
}
export const RemoveGroupConf = "Are you sure? This cannot be undone.";
export const RemoveGroupConfYes = "Yes, deactivate";

export function roleDisplayName(role: GroupRole) {
  if (role === "Owner") return "Administrator";
  return "Contributor";
}

export function roleDescription(role: GroupRole) {
  if (role === "Owner")
    return "Can edit group settings and delete group";
  return "Can contribute calendar data to this group";
}

export const GroupOnboardingHeader = "Welcome to Esper for Enterprise";
export const GroupOnboardingDescription = <div>
  <p>
    Esper for Enterprise lets you track meetings across your entire
    organization. Categorize events, identify costly time sinks,
    and more.
  </p>
  <p>
    It looks like you're currently not a member of an Esper team. Ask
    someone on an existing Esper team to invite you, or click
    the button below to create your own.
  </p>
  <p>
    Need help? <a href="/contact">Click here to contact us.</a>
  </p>
</div>;
export const GroupOnboardingStart = "Get Started";

export const Adjectives = [
  "Above Average",
  "Amazing",
  "Awesome",
  "Excellent",
  "Fantastic",
  "Intimidating",
  "Mildly Amusing",
  "Miraculous",
  "Optimistic",
  "Purple",
  "Radical",
  "Super Productive",
  "Sweet"
];
export const Nouns = [
  "Band",
  "Compadres",
  "Company",
  "Gaggle of Geese",
  "Miracle-Workers",
  "Party",
  "Posse",
  "Squad",
  "Team",
  "Troopers",
  "Wolfpack"
];
export function defaultGroupName(name?: string) {
  let article = name ? `${_.capitalize(name)}'s` : "The";
  let adj = _.sample(Adjectives);
  let noun = _.sample(Nouns);
  return `${article} ${adj} ${noun}`;
}

export const GroupNoTeamDescription =
  "You're currently not sharing any calendars with this team on Esper. " +
  "Click on the calendar icon next to your name or email in the list " +
  "below to pick which calendars to share. Or invite other " +
  "team members to Esper to share their calendars with you.";
export const NoTeamBtnTooltip =
  "Please share a calendar with Esper before continuing.";
export const GroupShareCalendarBtn = "Share";
export const GroupOnboardingEnd = "Start Using Esper";

export const TimebombEnable = "Enable \"move to email\" for meetings";
export const TimebombDescribe = <p>
  One workday before a meeting, Esper will send an email to all meeting guests
  asking them to confirm that they want to attend. If no one confirms, Esper
  will remove the meeting from everyone's calendar 1 hour before the event
  and send an email to all guests that the meeting has been "moved to email".
  If at least one person confirms, the meeting will proceed as planned.
</p>;
export const TimebombMinGuests =
  "Minimum number of guests in event to activate";
export const TimebombMaxGuests =
  "Maximum number of guests in event to activate";

export function noContentMessage(href: string) {
  return <div className="no-content-msg">
    Missing calendar events? You may need to share your calendar
    with Esper or invite others to share their's. <a href={href}>
      Go to the settings page to see calendar sharing options.
    </a>
  </div>;
}

export const GoToGroupsMsg =
  "You're signed up for Esper for Enterprise. " +
  "Click here to switch to your Enterprise account.";

export const ExportCSVHeading = "Export as CSV";
export const ExportSelectText = "Select dates to export";
export const ExportCSVDescription = <p>
  Export Esper data for this team as a CSV file.
  Select a date range. Then click the download button.
</p>;