import * as _ from "lodash";
import * as ApiT from "../lib/apiT";
import { ApiSvc } from "../lib/api";
import { LoginState } from "../lib/login";
import { GroupState, GroupDataAction } from "../states/groups";
import { ok, ready } from "../states/data-status";
import { compactObject as compact } from "../lib/util";

/*
  Clean group id -- verify it matches a groupId in login state
  Default to first groupId if one in state. Else return null.
*/
export function cleanGroupId(groupId: string, state: LoginState): string|null {
  if (state.login) {
    if (_.includes(state.login.groups, groupId)) {
      return groupId;
    } else if (_.isString(state.login.groups[0])) {
      return state.login.groups[0];
    }
  }
  return null;
}

// Fetch a single group
export function fetch(groupid: string, opts: {
  withMembers?: boolean;
  withLabels?: boolean;
}, deps: {
  dispatch: (a: GroupDataAction) => GroupDataAction;
  state: GroupState;
  Svcs: ApiSvc
}): Promise<void> {
  let { Api } = deps.Svcs;

  // Fetch if group doesn't exist
  let summary = deps.state.groupSummaries[groupid];
  let labels = deps.state.groupLabels[groupid];
  let members = deps.state.groupMembers[groupid];
  let shouldFetch = !ok(summary) ||
    (opts.withLabels && !ok(labels)) ||
    (opts.withMembers && !ok(members));

  if (shouldFetch) {
    deps.dispatch(compact<GroupDataAction>({
      type: "GROUP_DATA",
      dataType: "FETCH_START",
      groupIds: [groupid],
      withMembers: opts.withMembers,
      withLabels: opts.withLabels
    }));

    return Api.getGroupDetails(groupid, opts)
      .then((group) => {
        deps.dispatch(compact<GroupDataAction>({
          type: "GROUP_DATA",
          dataType: "FETCH_END",
          groupIds: [groupid],
          groups: [group],
          withMembers: opts.withMembers,
          withLabels: opts.withLabels
        }));
      });
  }
  return Promise.resolve(undefined);
}

// Rename a group
export function renameGroup(groupId: string, name: string, deps: {
  dispatch: (a: GroupDataAction) => any;
  state: GroupState;
  Svcs: ApiSvc;
}) {
  if (! name) return Promise.reject(new Error("Invalid name"));
  let summary = deps.state.groupSummaries[groupId];
  if (ready(summary)) {
    let newSummary = _.clone(summary);
    newSummary.group_name = name;
    deps.dispatch({
      type: "GROUP_DATA",
      dataType: "PUSH",
      groups: [newSummary]
    });
  }
  return deps.Svcs.Api.renameGroup(groupId, name);
}

// Fetch group names after logging in
export function initData(info: ApiT.LoginResponse, deps: {
  dispatch: (a: GroupDataAction) => any;
  Svcs: ApiSvc;
}) {
  deps.dispatch({
    type: "GROUP_DATA",
    dataType: "FETCH_START",
    groupIds: info.groups,
  });

  return deps.Svcs.Api.getGroupsByUid(info.uid, {})
    .catch((err) => ({ items: [] as ApiT.Group[] }))
    .then((groupList) => {
      deps.dispatch({
        type: "GROUP_DATA",
        dataType: "FETCH_END",
        groupIds: info.groups,
        groups: groupList.items
      });
    });
}