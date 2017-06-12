import * as _ from "lodash";
import { ApiSvc } from "../lib/api";
import * as ApiT from "../lib/apiT";
import { LoginState, FeatureFlagAction } from "../lib/login";
import { NavSvc } from "../lib/routing";
import { QueueMap } from "../lib/queue";
import * as PrefsState from "../states/team-preferences";
import { ready } from "../states/data-status";
import { ensureFlags } from "./feature-flags";

export function fetch(teamId: string, deps: {
  dispatch: (action: PrefsState.DataAction) => void;
  state: PrefsState.TeamPreferencesState;
  Svcs: ApiSvc;
}, opts: {
  force?: boolean;
} = {}) {
  let current = deps.state.teamPreferences[teamId];
  if (opts.force || !ready(current)) {
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
      return preferences;
    }, () => {
      // Dispatches error state
      deps.dispatch({
        type: "TEAM_PREFERENCES_DATA",
        dataType: "FETCH_END",
        teamId
      });
    });
  }
  return Promise.resolve(current);
}

// Queue put operations (use last set of prefs)
interface PrefsUpdate {
  prefs: ApiT.Preferences;
  Svcs: ApiSvc;
}

export const TeamPrefsQueue = new QueueMap<PrefsUpdate>((teamId, q) => {
  let last = _.last(q);
  if (! last) return Promise.resolve([]);
  let { Svcs, prefs } = last;
  return Svcs.Api.putPreferences(teamId, prefs).then(() => []);
});

export async function update(
  teamId: string,
  update: Partial<ApiT.Preferences>,
  deps: {
    dispatch: (action: PrefsState.UpdateAction) => void;
    state: PrefsState.TeamPreferencesState;
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
    await TeamPrefsQueue.get(teamId).enqueue({
      prefs, Svcs: deps.Svcs
    });
    return prefs;
  }

  return current;
}

// Auto-set timebomb preferences for new team (if applicable)
export async function autosetTimebomb(teamId: string, deps: {
  dispatch: (
    action: PrefsState.DataAction|PrefsState.UpdateAction|FeatureFlagAction
  ) => void;
  state: PrefsState.TeamPreferencesState & LoginState;
  Svcs: ApiSvc;
}) {
  // Make sure feature flag set for timebomb
  ensureFlags({ tb: true }, deps);

  // Make sure we have prefs
  let prefs = await fetch(teamId, deps);

  // If timebomb undefined, turn it on
  if (typeof prefs.tb === "undefined") {
    return update(teamId, { tb: true }, {
      ...deps,
      state: {
        ...deps.state,
        teamPreferences: {
          ...deps.state.teamPreferences,
          [teamId]: prefs
        }
      }
    });
  }

  // Already defined, return as is
  return prefs;
}

export function toggleDailyAgenda(
  teamId: string,
  val: boolean,
  deps: {
    dispatch: (action: PrefsState.UpdateAction) => void;
    state: PrefsState.TeamPreferencesState & LoginState;
    Svcs: ApiSvc;
  }
) {
  if (! deps.state.login) throw new Error("Not logged in");

  let prefs = deps.state.teamPreferences[teamId];
  if (! ready(prefs)) throw new Error("Prefs not ready yet");

  let email = deps.state.login.email;
  let current = prefs.email_types.daily_agenda.recipients
  let recipients = val ? _.union(current, [email]) : _.without(current, email);
  return update(teamId, {
    email_types: {
      ...prefs.email_types,
      daily_agenda: {
        ...prefs.email_types.daily_agenda,
        recipients
      }
    }
  }, deps);
}

/*
  Enables Slack. Also takes preferences update so we can do things like
  turn on Slack communication before we go to Slack auth page.
*/
export async function enableSlack(
  teamId: string,
  prefs: Partial<ApiT.Preferences>,
  deps: {
    dispatch: (action: PrefsState.UpdateAction) => void;
    state: PrefsState.TeamPreferencesState;
    Svcs: ApiSvc & NavSvc;
  }
) {
  if (! _.isEqual(prefs, {})) {
    await update(teamId, prefs, deps);
  }

  let x = await deps.Svcs.Api.getSlackAuthInfo(teamId);
  return deps.Svcs.Nav.go(x.slack_auth_url);
}

// Update Slack-related prefs -- enables Slack only if necessary
export function ensureSlack(
  teamId: string,
  prefs: Partial<ApiT.Preferences>,
  deps: {
    dispatch: (action: PrefsState.UpdateAction) => void;
    state: PrefsState.TeamPreferencesState;
    Svcs: ApiSvc & NavSvc;
  }
) {
  let currentPrefs = deps.state.teamPreferences[teamId];
  if (ready(currentPrefs)) {
    if (! currentPrefs.slack_address) {
      return enableSlack(teamId, prefs, deps);
    }
  }
  return update(teamId, prefs, deps);
}