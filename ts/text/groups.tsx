/*
  Group-specific text
*/
import { GroupRole } from "../lib/apiT";

export const Group = "Enterprise Account";
export const Groups = "Enterprise Accounts";

export function roleDisplayName(role: GroupRole) {
  if (role === "Owner") return "Administrator";
  if (role === "Manager") return "Manager";
  return "Contributor";
}

export function roleDescription(role: GroupRole) {
  if (role === "Owner")
    return "Can edit group settings and delete group";
  if (role === "Manager")
    return "Can view calendar data for other group members";
  return "Can contribute calendar data to this group";
}
