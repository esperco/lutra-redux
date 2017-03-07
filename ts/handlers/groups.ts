import * as _ from "lodash";
import * as moment from "moment-timezone";
import * as ApiT from "../lib/apiT";
import { ApiSvc } from "../lib/api";
import { updateLabelList } from "../lib/event-labels";
import { LoginState, LoggedInState } from "../lib/login";
import { QueueMap } from "../lib/queue";
import { NavSvc } from "../lib/routing";
import { compactObject as compact } from "../lib/util";
import {
  GroupPreferences,
  GroupState, GroupDataAction, GroupUpdateAction, GroupPreferencesAction,
  GroupAddGIMAction, GroupDeleteGIMAction, GroupAddTeamAction,
  GroupDeleteTeamAction
} from "../states/groups";
import { ok, ready } from "../states/data-status";
import { defaultGroupName } from "../text/groups";

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

// Onboarding -> new group
export function makeNewGroup(
  redirectFn: (groupId: string) => string,
  deps: {
    dispatch: (a: GroupDataAction) => any;
    state: GroupState & LoggedInState;
    Svcs: NavSvc & ApiSvc
  }
) {
  let name = deps.state.login.email.split('@')[0];
  return deps.Svcs.Api.createGroup({
    group_name: defaultGroupName(name),
    group_timezone: moment.tz.guess()
  }).then((g) => {
    deps.dispatch({
      type: "GROUP_DATA",
      dataType: "FETCH_END",
      groupIds: [g.groupid],
      groups: [g]
    });
    deps.Svcs.Nav.go(redirectFn(g.groupid));
  });
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

// Fetch group preferences
export function fetchPreferences(groupid: string, deps: {
  dispatch: (a: GroupPreferencesAction) => GroupPreferencesAction;
  state: GroupState;
  Svcs: ApiSvc;
}): Promise<void> {
  let { Api } = deps.Svcs;

  // Fetch if preferences doesn't exist
  if (!ok(deps.state.groupPreferences[groupid])) {
    deps.dispatch(compact<GroupPreferencesAction>({
      type: "GROUP_PREFS",
      dataType: "FETCH_START",
      groupIds: [groupid]
    }));

    return Api.getGroupPreferences(groupid)
      .then((prefs) => {
        deps.dispatch(compact<GroupPreferencesAction>({
          type: "GROUP_PREFS",
          dataType: "FETCH_END",
          groupIds: [groupid],
          groupPrefs: [prefs]
        }));
      });
  }
  return Promise.resolve();
}


/* Update preferences */

function updatePrefs(
  groupId: string,
  update: Partial<GroupPreferences>,
  deps: {
    dispatch: (a: GroupUpdateAction) => any;
    state: GroupState & LoggedInState;
    Svcs: ApiSvc;
  }
): Promise<void> {
  let current = deps.state.groupPreferences[groupId];
  if (ready(current)) {
    deps.dispatch({
      type: "GROUP_UPDATE",
      groupId,
      preferences: update
    });
    let newPrefs = {
      groupid: groupId,
      uid: deps.state.login.uid,
      ...current,
      ...update
    };
    return deps.Svcs.Api.putGroupPreferences(groupId, newPrefs);
  }
  return Promise.resolve();
}

export function updateDailyEmail(groupId: string, val: boolean, deps: {
  dispatch: (a: GroupUpdateAction) => any;
  state: GroupState & LoggedInState;
  Svcs: ApiSvc;
}): Promise<void> {
  return updatePrefs(groupId, { daily_breakdown: val }, deps);
}


/* Manage group members */

export function addSelfTeam(groupId: string, deps: {
  dispatch: (a: GroupAddTeamAction) => any;
  Svcs: ApiSvc;
}): Promise<ApiT.GroupMember> {
  return deps.Svcs.Api.putSelfTeamAsGroupMember(groupId).then((member) => {
    deps.dispatch({
      type: "GROUP_ADD_TEAM",
      groupId,
      member
    });
    return member;
  })
}

export function addGroupIndividual(
  groupId: string,
  email: string,
  deps: {
    dispatch: (a: GroupAddGIMAction) => any;
    state: GroupState;
    Svcs: ApiSvc;
  }
): Promise<string|void> {
  // Dispatch placeholder GIM
  deps.dispatch({
    type: "GROUP_ADD_GIM",
    groupId,
    gim: {
      email,
      role: "Member" as "Member"
    }
  });

  return deps.Svcs.Api.putGroupIndividualByEmail(groupId, email)
    .then((resp) => {
      deps.dispatch(compact({
        type: "GROUP_ADD_GIM" as "GROUP_ADD_GIM",
        groupId,
        gim: {
          email,
          ...resp.gim
        },
        member: resp.opt_gm ? {
          email,
          ...resp.opt_gm
        } : undefined
      }));

      if (resp.opt_gm) {
        return resp.opt_gm.teamid;
      }
      return;
    });
}

export function removeGroupIndividual(
  groupId: string,
  gim: ApiT.GroupIndividual,
  deps: {
    dispatch: (a: GroupDeleteGIMAction) => any;
    state: GroupState;
    Svcs: ApiSvc;
  }
): Promise<void> {
  if (!gim.uid) return Promise.resolve();
  let { dispatch, Svcs } = deps;

  dispatch({
    type: "GROUP_DELETE_GIM",
    groupId,
    gim
  });
  return Svcs.Api.removeGroupIndividual(groupId, gim.uid);
}

export function removeTeam(
  groupId: string,
  teamId: string,
  deps: {
    dispatch: (a: GroupDeleteTeamAction) => any;
    Svcs: ApiSvc;
  }
): Promise<void> {
  deps.dispatch({ type: "GROUP_DELETE_TEAM", groupId, teamId });
  return deps.Svcs.Api.removeGroupMember(groupId, teamId);
}


/* Patch group details */

interface GroupPatch {
  patch: ApiT.GroupUpdatePatch;
  Svcs: ApiSvc;
}

// Combines patch queries into single API call
export const PatchQueue = new QueueMap<GroupPatch>((groupId, q) => {
  let { Svcs } = _.last(q);
  let patch = _.reduce(q,
    (result, v) => ({ ...result, ...v.patch }),
    {} as ApiT.GroupUpdatePatch);
  return Svcs.Api.patchGroupDetails(groupId, patch).then(() => []);
});

export function patchGroupDetails(groupId: string,
  patch: ApiT.GroupUpdatePatch,
  deps: {
    dispatch: (a: GroupUpdateAction) => any;
    state: GroupState;
    Svcs: ApiSvc;
  })
{
  let { dispatch, Svcs } = deps;
  dispatch({
    type: "GROUP_UPDATE",
    groupId,
    summary: patch
  });
  return PatchQueue.get(groupId).enqueue({ patch, Svcs });
}

export function renameGroup(groupId: string, name: string, deps: {
  dispatch: (a: GroupUpdateAction) => any;
  state: GroupState;
  Svcs: ApiSvc;
}) {
  if (! name) return Promise.reject(new Error("Invalid name"));
  return patchGroupDetails(groupId, {
    group_name: name
  }, deps);
}


/* Update group labels */

interface GroupLabelUpdate {
  labels: ApiT.LabelInfo[];    // Label set to PUT

  // Normalized list of new labels (so we know which colors to set)
  newLabels: ApiT.LabelInfo[];

  // Deps
  Svcs: ApiSvc;
}

export function processGroupLabelUpdates(
  groupId: string,
  queue: GroupLabelUpdate[],
) {
  // Use Svcs from first item
  let { Api } = queue[0].Svcs;

  // Get all new labels
  let newLabels: Record<string, boolean> = {};
  _.each(queue,
    (q) => _.each(q.newLabels,
      (l) => newLabels[l.normalized] = true
    )
  );

  // Since we're just putting all of our labels at once, just look to
  // last item in queue
  let last = queue[queue.length - 1];
  if (last) {
    let labels = last.labels;
    return Api.putGroupLabels(groupId, {
      labels: _.map(labels, (l) => l.original)
    })

    // Separate API call for colors (batch for effiency)
    .then(() => Api.batch(() => Promise.all(
      _(labels)
        .filter((l) => newLabels[l.normalized])
        .map((l) => Api.setGroupLabelColor(groupId, {
          label: l.original,
          color: l.color || "#999999"
        }))
        .value()
    )))

    // Clear queue
    .then(() => []);
  }

  return Promise.resolve([]);
}

export const LabelQueues = new QueueMap(processGroupLabelUpdates);

export function setGroupLabels(props: {
  groupId: string,
  addLabels?: ApiT.LabelInfo[];
  rmLabels?: ApiT.LabelInfo[];
}, deps: {
    dispatch: (a: GroupUpdateAction) => any;
    state: GroupState;
    Svcs: ApiSvc;
  }
) {
  // Figure out new label set to queue for API
  let groupLabels = deps.state.groupLabels[props.groupId];
  if (ready(groupLabels)) {
    let labels = updateLabelList(groupLabels.group_labels, {
      add: props.addLabels,
      rm: props.rmLabels
    });

    // Make changes only if new labels
    if (! _.isEqual(labels, groupLabels.group_labels)) {

      // Update state
      deps.dispatch({
        type: "GROUP_UPDATE",
        groupId: props.groupId,
        labels: { group_labels: labels }
      });

      // Queue API call
      let queue = LabelQueues.get(props.groupId);
      return queue.enqueue({
        labels,
        newLabels: props.addLabels || [],
        Svcs: deps.Svcs
      });
    }
  }

  return Promise.resolve();
}


// Delete groups
export function deleteGroup(groupId: string, deps: {
  Svcs: ApiSvc & NavSvc;
}): Promise<void> {
  return deps.Svcs.Api.deleteGroup(groupId).then(() => {
    deps.Svcs.Nav.refresh(true);
  });
}

// Fetch group names after logging in
export function initData(info: ApiT.LoginResponse, deps: {
  dispatch: (a: GroupDataAction) => any;
  Svcs: ApiSvc;
}) {
  deps.dispatch({
    type: "GROUP_DATA",
    dataType: "FETCH_START",
    groupIds: info.groups
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