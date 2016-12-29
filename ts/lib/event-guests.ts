import * as _ from "lodash";
import { validateEmailAddress, OrderedSet } from "../lib/util";

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