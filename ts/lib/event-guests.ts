import { validateEmailAddress, OrderedSet } from "../lib/util";
import { GroupMembers } from "../states/groups";

const GUEST_FILTER_LIMIT = 10;

export type Guest = {
  displayName?: string;
  email: string;
}|{
  displayName: string;
  email?: string;
};

export class GuestSet extends OrderedSet<Guest> {
  /*
    Maps display names to key fn (which may be e-mail). This works imperfectly
    if different guests have the same name, but it's better than having to
    iterate over the entire list every time we're checking for one person.
  */
  _nameMap: { [index: string]: string; }

  constructor(lst: Guest[]) {
    super([], normalizeGuest);
    this._nameMap = {};
    this.push(...lst);
  }

  getByKey(key: string): Guest {
    return super.getByKey(key) || super.getByKey(this._nameMap[key]);
  }

  hasKey(key: string): boolean {
    return super.hasKey(key) || super.hasKey(this._nameMap[key]);
  }

  push(...guests: Guest[]): void {
    super.push(...guests);
    guests.forEach((g) => {
      if (g.displayName) {
        this._nameMap[normalize(g.displayName)] = this._keyFn(g);
      }
    });
  }

  pull(...guests: Guest[]): void {
    super.pull(...guests);
    guests.forEach((g) => {
      if (g.displayName) {
        delete this._nameMap[normalize(g.displayName)];
      }
    });
  }

  clone() {
    let ret = super.clone();
    ret._nameMap = Object.assign({}, this._nameMap);
    return ret;
  }
}

// Normalize guest emails / name
export function normalize(str: string): string {
  return str.trim().toLowerCase();
}

// Normalize actual guest
export function normalizeGuest(guest: Guest): string {
  return normalize(guest.email || guest.displayName || "");
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
export function guestSetFromGroupMembers(
  members: GroupMembers,
  incIndividuals = true
): GuestSet {
  let ret = new GuestSet([]);

  if (incIndividuals) {
    members.group_individuals.forEach((gim) => gim.email ? ret.push({
      email: gim.email
    }) : null);
  }

  members.group_teams.forEach((team) => team.email ? ret.push({
    email: team.email,
    displayName: team.name
  }) : null);

  return ret;
}

/*
  For use with filter menu -- returns two-tuple of any guest that matches
  filter string exactly, followed by any other guests that contain filter
*/
export function filter(
  guestSet: GuestSet,
  str: string,
  limit = GUEST_FILTER_LIMIT
): [Guest|undefined, Guest[]] {
  str = normalize(str);
  let filtered = guestSet.filter((g) => !!(
    (g.email && normalize(g.email).includes(str)) ||
    (g.displayName && normalize(g.displayName).includes(str))
  ), limit);
  let match = guestSet.getByKey(str);
  if (match && filtered.has(match)) {
    filtered = filtered.without(match);
  }
  return [match, filtered.toList()];
}
