import * as _ from "lodash";
import { ApiSvc } from "../lib/api";
import * as ApiT from "../lib/apiT";
import { QueueMap } from "../lib/queue";
import * as PrefsState from "../states/team-preferences";
import { ok, ready } from "../states/data-status";

export function fetch(teamId: string, deps: {
  dispatch: (action: PrefsState.DataAction) => void;
  state: PrefsState.TeamPreferencesState
  Svcs: ApiSvc
}, opts: {
  force?: boolean;
} = {}) {
  let current = deps.state.teamPreferences[teamId];
  if (opts.force || !ok(current)) {
    deps.dispatch({
      type: "TEAM_PREFERENCES_DATA",
      dataType: "FETCH_START",
      teamId
    });

    return deps.Svcs.Api.getPreferences(teamId).then((preferences) => {
      // Dispatches data
      deps.dispatch({
        type: "TEAM_PREFERENCES_DATA",
        dataType: "FETCH_END",
        teamId, preferences
      });
    }, () => {
      // Dispatches error state
      deps.dispatch({
        type: "TEAM_PREFERENCES_DATA",
        dataType: "FETCH_END",
        teamId
      });
    });
  }
  return Promise.resolve();
}

// Queue put operations (use last set of prefs)
interface PrefsUpdate {
  prefs: ApiT.Preferences;
  Svcs: ApiSvc;
}

export const TeamPrefsQueue = new QueueMap<PrefsUpdate>((teamId, q) => {
  let { Svcs, prefs } = _.last(q);
  return Svcs.Api.putPreferences(teamId, prefs).then(() => []);
});

export function update(
  teamId: string,
  update: Partial<ApiT.Preferences>,
  deps: {
    dispatch: (action: PrefsState.UpdateAction) => void;
    state: PrefsState.TeamPreferencesState
    Svcs: ApiSvc
  }
) {
  deps.dispatch({
    type: "TEAM_PREFERENCES_UPDATE",
    teamId, preferences: update
  });

  let current = deps.state.teamPreferences[teamId];
  if (ready(current)) {
    let prefs = { ...current, ...update };
    return TeamPrefsQueue.get(teamId).enqueue({
      prefs, Svcs: deps.Svcs
    });
  }
  return Promise.resolve();
}
