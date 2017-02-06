import * as _ from "lodash";
import * as ApiT from "../lib/apiT";
import { ApiSvc } from "../lib/api";
import { updateLabelList } from "../lib/event-labels";
import { LoginState } from "../lib/login";
import { QueueMap } from "../lib/queue";
import {
  GroupState, GroupDataAction, GroupUpdateAction, GroupPreferencesAction,
  GroupAddGIMAction, GroupDeleteGIMAction
} from "../states/groups";
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

export function addGroupIndividual(
  groupId: string,
  email: string,
  deps: {
    dispatch: (a: GroupAddGIMAction) => any;
    state: GroupState;
    Svcs: ApiSvc;
  }
): Promise<void> {
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
    .then((resp) => deps.dispatch(compact({
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
    })));
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


/* Rename Groups */

interface RenameUpdate {
  name: string;
  Svcs: ApiSvc;
}

// Use last name in queue for each group
export const RenameQueue = new QueueMap<RenameUpdate>((groupId, q) => {
  let { Svcs, name } = _.last(q);
  return Svcs.Api.renameGroup(groupId, name).then(() => []);
});

export function renameGroup(groupId: string, name: string, deps: {
  dispatch: (a: GroupUpdateAction) => any;
  state: GroupState;
  Svcs: ApiSvc;
}) {
  if (! name) return Promise.reject(new Error("Invalid name"));
  deps.dispatch({
    type: "GROUP_UPDATE",
    groupId,
    summary: {
      group_name: name
    }
  });
  return RenameQueue.get(groupId).enqueue({ name, ...deps });
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