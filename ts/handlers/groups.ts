import * as _ from "lodash";
import { ApiSvc } from "../lib/api";
import { LoginState } from "../lib/login";
import { GroupState, GroupDataAction } from "../states/groups";
import { ok } from "../states/data-status";
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
