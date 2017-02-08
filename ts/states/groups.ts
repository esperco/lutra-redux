import * as _ from "lodash";
import * as ApiT from "../lib/apiT";
import { ok, ready, StoreMap } from "./data-status";

/*
  Groups have optional group labels and member data -- store these separately
  for ease of checking what data is available and not
*/
export interface GroupSummary {
  group_name: string;
  group_timezone: string;
}

export interface GroupLabels {
  group_labels: ApiT.LabelInfo[];
}

export interface GroupMembers {
  group_member_role: ApiT.GroupRole;
  group_teams: ApiT.GroupMember[];
  group_individuals: ApiT.GroupIndividual[];
}

export interface GroupPreferences {
  daily_breakdown: boolean;
  weekly_breakdown: boolean;
  bad_meeting_warning: boolean;
  bad_duration: number;
  bad_attendees: number;
}

export interface GroupState {
  groupSummaries: StoreMap<GroupSummary>;
  groupLabels: StoreMap<GroupLabels>;
  groupMembers: StoreMap<GroupMembers>;
  groupPreferences: StoreMap<GroupPreferences>;
}

export interface GroupFetchRequestAction {
  type: "GROUP_DATA";
  dataType: "FETCH_START";
  groupIds: string[];
  withMembers?: boolean;
  withLabels?: boolean;
}

export interface GroupFetchResponseAction {
  type: "GROUP_DATA";
  dataType: "FETCH_END";
  groups: ApiT.Group[];
  groupIds: string[]; // Keep group ids so we know if any groups were missing
  withMembers?: boolean;
  withLabels?: boolean;
}

export type GroupDataAction =
  GroupFetchRequestAction|
  GroupFetchResponseAction;

export interface GroupPreferencesRequestAction {
  type: "GROUP_PREFS";
  dataType: "FETCH_START";
  groupIds: string[];
}

export interface GroupPreferencesResponseAction {
  type: "GROUP_PREFS";
  dataType: "FETCH_END";
  groupPrefs: ApiT.GroupPreferences[];
  groupIds: string[]; // Keep group ids so we know if any groups were missing
}

export type GroupPreferencesAction =
  GroupPreferencesRequestAction|
  GroupPreferencesResponseAction;

export interface GroupUpdateAction {
  type: "GROUP_UPDATE";
  groupId: string;
  summary?: Partial<GroupSummary>;
  labels?: Partial<GroupLabels>;
  members?: Partial<GroupMembers>;
  preferences?: Partial<GroupPreferences>;
}

export interface GroupAddGIMAction {
  type: "GROUP_ADD_GIM";
  groupId: string;
  gim: ApiT.GroupIndividual;
  member?: ApiT.GroupMember; // Member or team associated with GIM
}

export interface GroupDeleteGIMAction {
  type: "GROUP_DELETE_GIM";
  groupId: string;
  gim: ApiT.GroupIndividual;
}

export interface GroupDeleteTeamAction {
  type: "GROUP_DELETE_TEAM";
  groupId: string;
  teamId: string;
}

export function groupPreferencesReducer<S extends GroupState>(
  state: S, action: GroupPreferencesAction
) {
  state = _.clone(state);
  let groupPreferences = state.groupPreferences
                       = _.clone(state.groupPreferences);

  if (action.dataType === "FETCH_START") {
    _.each(action.groupIds, (id) => {
      if (!ok(groupPreferences[id])) {
        groupPreferences[id] = "FETCHING";
      }
    });
  } else {
    if (action.dataType === "FETCH_END") {
      _.each(action.groupIds, (id) => {
        groupPreferences[id] = "FETCH_ERROR";
      });
    }

    _.each(action.groupPrefs, (prefs) => {
      groupPreferences[prefs.groupid] = {
        daily_breakdown: prefs.daily_breakdown,
        weekly_breakdown: prefs.weekly_breakdown,
        bad_meeting_warning: prefs.bad_meeting_warning,
        bad_duration: prefs.bad_duration,
        bad_attendees: prefs.bad_attendees
      };
    })
  }

  return state;
}

export function groupDataReducer<S extends GroupState> (
  state: S, action: GroupDataAction
) {
  state = _.clone(state);
  let groupSummaries = state.groupSummaries = _.clone(state.groupSummaries);
  let groupLabels = state.groupLabels = _.clone(state.groupLabels);
  let groupMembers = state.groupMembers = _.clone(state.groupMembers);

  // If data start -- mark as fetching if none
  if (action.dataType === "FETCH_START") {
    _.each(action.groupIds, (id) => {
      if (!ok(groupSummaries[id])) {
        groupSummaries[id] = "FETCHING";
      }
      if (action.withLabels && !ok(groupLabels[id])) {
        groupLabels[id] = "FETCHING";
      }
      if (action.withMembers && !ok(groupMembers[id])) {
        groupMembers[id] = "FETCHING";
      }
    });
  }

  // Else data ready
  else {

    // Anything id in the list gets marked as error unless replaced by
    // actual data
    if (action.dataType === "FETCH_END") {
       _.each(action.groupIds, (id) => {
        groupSummaries[id] = "FETCH_ERROR";
        if (action.withLabels) {
          groupLabels[id] = "FETCH_ERROR";
        }
        if (action.withMembers) {
          groupMembers[id] = "FETCH_ERROR";
        }
      });
    }

    _.each(action.groups, (g) => {
      groupSummaries[g.groupid] = {
        group_name: g.group_name,
        group_timezone: g.group_timezone
      };

      if (g.group_labels) {
        groupLabels[g.groupid] = {
          /*
            NB -- this sort shouldn't be required if order is preserved
            when PUT to server, but that doesn't always seem to work.

            TODO: Fix if server API changes.
          */
          group_labels: _.sortBy(g.group_labels, (l) => l.normalized)
        };
      }

      if (g.group_individuals && g.group_member_role && g.group_teams) {
        groupMembers[g.groupid] = {
          group_member_role: g.group_member_role,
          group_teams: g.group_teams,
          group_individuals: g.group_individuals
        };
      }
    });
  }

  return state;
}

export function groupUpdateReducer<S extends GroupState> (
  state: S, action: GroupUpdateAction
): S {
  let { groupId } = action;
  let update: Partial<GroupState> = {};
  if (action.summary) {
    let current = state.groupSummaries[groupId];
    if (ready(current)) {
      update.groupSummaries = {
        ...state.groupSummaries,
        [groupId]: { ...current, ...action.summary }
      };
    }
  }

  if (action.labels) {
    let current = state.groupLabels[groupId];
    if (ready(current)) {
      update.groupLabels = {
        ...state.groupLabels,
        [groupId]: { ...current, ...action.labels }
      };
    }
  }

  if (action.members) {
    let current = state.groupMembers[groupId];
    if (ready(current)) {
      update.groupMembers = {
        ...state.groupMembers,
        [groupId]: { ...current, ...action.members }
      };
    }
  }

  if (action.preferences) {
    let current = state.groupPreferences[groupId];
    if (ready(current)) {
      update.groupPreferences = {
        ...state.groupPreferences,
        [groupId]: { ...current, ...action.preferences }
      };
    }
  }

  return _.extend({}, state, update);
}

// Add GIM but ensure no e-mail OR uid duplication
export function groupAddGIMReducer<S extends GroupState>(
  state: S, action: GroupAddGIMAction
): S {
  let { groupId, gim, member } = action;
  let current = state.groupMembers[groupId];
  if (ready(current)) {
    let group_individuals = _.clone(current.group_individuals);
    let index = _.findIndex(group_individuals,
      (i) => (i.email && i.email === gim.email) ||
             (i.uid && i.uid === gim.uid));

    // Existing email or UID => merge
    if (index > -1) {
      group_individuals[index] = {
        ...group_individuals[index],
        ...gim
      };
    }

    // New => append
    else {
      group_individuals.push(action.gim);
    }

    // Check if there's an associated team as well
    let group_teams = _.clone(current.group_teams);
    if (member) {
      let m = member; // Fix reference for type-checking purposes
      let index = _.findIndex(group_teams, (t) => t.teamid === m.teamid);
      if (index > -1) {
        group_teams[index] = { ...group_teams[index], ...m }
      } else {
        group_teams.push(m);
      }
    }

    return _.extend({}, state, {
      groupMembers: {
        ...state.groupMembers,
        [groupId]: {
          ...current,
          group_individuals,
          group_teams
        }
      }
    });
  }
  return state;
}

export function groupDeleteGIMReducer<S extends GroupState>(
  state: S, action: GroupDeleteGIMAction
): S {
  let { groupId, gim } = action;
  let current = state.groupMembers[groupId];

  if (ready(current)) {
    return _.extend({}, state, {
      groupMembers: {
        ...state.groupMembers,
        [groupId]: {
          ...current,
          group_individuals: _.filter(current.group_individuals,
            (i) => !((i.uid && i.uid === gim.uid) ||
                     (i.email && i.email === gim.email))),
          group_teams: _.filter(current.group_teams,
            (t) => !(t.email && t.email === gim.email))
        }
      }
    });
  }

  return state;
}

export function groupDeleteTeamReducer<S extends GroupState>(
  state: S, action: GroupDeleteTeamAction
): S {
  let { groupId, teamId } = action;
  let current = state.groupMembers[groupId];

  if (ready(current)) {
    return _.extend({}, state, {
      groupMembers: {
        ...state.groupMembers,
        [groupId]: {
          ...current,
          group_teams: _.filter(current.group_teams,
            (t) => t.teamid !== teamId)
        }
      }
    });
  }

  return state;
}

export function initState(): GroupState {
  return {
    groupSummaries: {},
    groupLabels: {},
    groupMembers: {},
    groupPreferences: {}
  };
}
