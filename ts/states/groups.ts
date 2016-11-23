import * as _ from "lodash";
import * as ApiT from "../lib/apiT";
import { ok, StoreMap } from "./data-status";

/*
  Groups have optional group labels and member data -- store these separately
  for ease of checking what data is available and not
*/
export interface GroupSummary {
  groupid: string;
  group_name: string;
  group_timezone: string;
}

export interface GroupLabels {
  groupid: string;
  group_labels: ApiT.LabelInfo[];
}

export interface GroupMembers {
  groupid: string;
  group_member_role: ApiT.GroupRole;
  group_teams: ApiT.GroupMember[];
  group_individuals: ApiT.GroupIndividual[];
}

export interface GroupState {
  groupSummaries: StoreMap<GroupSummary>;
  groupLabels: StoreMap<GroupLabels>;
  groupMembers: StoreMap<GroupMembers>;
}

export interface GroupFetchRequestAction {
  type: "GROUP_DATA";
  dataType: "FETCH_START";
  groupIds: string[];
  withMembers?: boolean;
  withLabels?: boolean;
}

export interface GroupPushAction {
  type: "GROUP_DATA";
  dataType: "PUSH";
  groups: ApiT.Group[];
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
  GroupFetchResponseAction|
  GroupPushAction;

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
        groupid: g.groupid,
        group_name: g.group_name,
        group_timezone: g.group_timezone
      };

      if (g.group_labels) {
        groupLabels[g.groupid] = {
          groupid: g.groupid,
          group_labels: g.group_labels
        };
      }

      if (g.group_individuals && g.group_member_role && g.group_teams) {
        groupMembers[g.groupid] = {
          groupid: g.groupid,
          group_member_role: g.group_member_role,
          group_teams: g.group_teams,
          group_individuals: g.group_individuals
        };
      }
    });
  }

  return state;
}

export function initState(): GroupState {
  return {
    groupSummaries: {},
    groupLabels: {},
    groupMembers: {}
  };
}
