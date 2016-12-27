export const NoTitle = "Untitled Event";
export const NotFound = "Event Not Found";
export const Recurring = "Recurring Event";
export const FilterEvents = "Filter by Keyword";

export const Attendees = "Guests";
export function attendeeStatus(
  status: "Needs_action"|"Declined"|"Tentative"|"Accepted"
) {
  switch(status) {
    case "Declined":
      return "Declined";
    case "Tentative":
      return "Tentative";
    case "Accepted":
      return "Accepted";
    default:
      return "No Response"
  }
}

export function attendeeMsgShort(attendees: string[]) {
  if (attendees.length === 0) { return ""; }
  if (attendees.length === 1) { return attendees[0]; }
  if (attendees.length === 2) {
    return `${attendees[0]} and ${attendees[1]}`;
  }
  return `${attendees[0]} and ${attendees.length - 1} others`;
}
