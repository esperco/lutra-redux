/*
  Team-specific state / API code
*/

import * as _ from "lodash";
import * as moment from "moment-timezone";
import * as ApiT from "../lib/apiT";
import { ApiSvc } from "../lib/api";
import { LoginAction, LoginState } from "../lib/login";
import { QueueMap } from "../lib/queue";

export function getSelfExecTeam(deps: {
  state: LoginState;
}): ApiT.Team|undefined {
  let { state } = deps;
  if (! state.login) throw new Error("Must be logged in");
  let login = state.login;
  return _.find(login.teams, (t) => t.team_executive === login.uid);
}

/*
  Get the team for which the current user is the exec. If no such team
  exists, create one.
*/

// Promise for the below function -- ensures we don't call below more
// than once
let ensureSelfExecTeamP: Promise<ApiT.Team>|undefined;

export function ensureSelfExecTeam(deps: {
  state: LoginState;
  dispatch: (a: LoginAction) => void;
  Svcs: ApiSvc;
}): Promise<ApiT.Team> {
  let { state, Svcs, dispatch } = deps;
  if (! state.login) throw new Error("Must be logged in");
  let login = state.login;

  // If existing team, use that one.
  let team = _.find(login.teams, (t) => t.team_executive === login.uid);
  if (team) {
    return Promise.resolve(team);
  }

  // If existing unresolved promise, return that
  if (ensureSelfExecTeamP) return ensureSelfExecTeamP;

  // Create team instead
  ensureSelfExecTeamP = Svcs.Api.createTeam({
    executive_name: state.login.email,
    executive_timezone: moment.tz.guess()
  }).then((team) => {

    /*
      Semantically this isn't really a login -- but it's the simplest way to
      update login state right now.
    */
    dispatch({
      type: "LOGIN",
      info: {
        ...login,
        teams: [ ...login.teams, team ]
      }
    });
    return team;
  }).catch((err) => {
    ensureSelfExecTeamP = undefined;
    throw err;
  });

  return ensureSelfExecTeamP;
}

// Renaming team -- just use last queued result
export const RenameQueue = new QueueMap<{
  name: string;
  Svcs: ApiSvc;
}>((teamId, q) => {
  let { name, Svcs } = _.last(q);
  return Svcs.Api.setTeamName(teamId, name).then(() => []);
});

export function renameTeam(teamId: string, name: string, deps: {
  state: LoginState;
  dispatch: (a: LoginAction) => void;
  Svcs: ApiSvc;
}) {
  let { state, Svcs, dispatch } = deps;
  if (! state.login) throw new Error("Must be logged in");
  let login = state.login;
  let teamIndex = _.findIndex(login.teams, (t) => t.teamid === teamId);
  if (teamIndex >= 0) {
    let team = login.teams[teamIndex];
    let teams = _.clone(login.teams);
    teams[teamIndex] = { ...team, team_name: name };
    dispatch({
      type: "LOGIN",
      info: { ...login, teams }
    });
  }
  RenameQueue.get(teamId).enqueue({ name, Svcs });
}