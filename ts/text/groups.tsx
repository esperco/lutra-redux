/*
  Group-specific text
*/
import { GroupRole } from "../lib/apiT";

export const Group = "Enterprise Account";
export const Groups = "Enterprise Accounts";
export const GroupCalendarSharingYes =
  "This user is sharing calendar data.";
export const GroupCalendarSharingNo =
  "This user is not sharing any calendars.";
export const GroupCalendarSharingEdit = "Pick which calendars to share.";

export function roleDisplayName(role: GroupRole) {
  if (role === "Owner") return "Administrator";
  return "Contributor";
}

export function roleDescription(role: GroupRole) {
  if (role === "Owner")
    return "Can edit group settings and delete group";
  return "Can contribute calendar data to this group";
}
