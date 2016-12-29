import * as _ from "lodash";
import { validateEmailAddress, OrderedSet } from "../lib/util";
import { GroupMembers } from "../states/groups";

export type Guest = {
  displayName?: string;
  email: string;
}|{
  displayName: string;
  email?: string;
};

export class GuestSet extends OrderedSet<Guest> {
  constructor(lst: Guest[]) {
    super(lst, (l) => normalize(l.email || l.displayName || ""));
  }
}

// Normalize guest emails / name
export function normalize(str: string): string {
  return str.trim().toLowerCase();
}

export function newGuest(str: string): Guest {
  if (validateEmailAddress(str)) {
    return {
      displayName: str,
      email: str
    }
  } else {
    return {
      displayName: str
    };
  }
}

// Generate a guest list from group data
export function guestSetFromGroupMembers(members: GroupMembers): GuestSet {
  let ret = new GuestSet([]);
  _.each(members.group_individuals, (gim) => gim.email ? ret.push({
    email: gim.email
  }) : null);

  _.each(members.group_teams, (team) => team.email ? ret.push({
    email: team.email,
    displayName: team.name
  }) : null);

  return ret;
}

export function filter(guest: Guest, filter: string): boolean {
  filter = normalize(filter);
  return !!((guest.email && _.includes(normalize(guest.email), filter)) ||
    (guest.displayName && _.includes(normalize(guest.displayName), filter)));
}

export function match(guest: Guest, filter: string): boolean {
  filter = normalize(filter);
  return !!((guest.email && filter === normalize(guest.email)) ||
    (guest.displayName && filter === normalize(guest.displayName)));
}