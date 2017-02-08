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

export const GroupName = "Team Name";
export const GroupNamePlaceholder = "Guardians of the Galaxy";
export const GroupTimezone = "Timezone";

export const DailyEmail = "Daily Team Summary Email";
export function alertsGoTo(email: string) {
  return <span>
    These alerts will go to <strong>{email}</strong>
  </span>;
}

export const RemoveGroupBtn = "Deactivate";
export function removeGroupDescription(group?: string) {
  return `Deactivate ${group || "this " + Group}? This will remove all ` +
         `tags and related data. This cannot be undone.`;
}

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