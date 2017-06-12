/*
  Make fake login state
*/

import * as ApiT from "../lib/apiT";

export default function makeLoginInfo(
  info: Partial<ApiT.LoginResponse>
): ApiT.LoginResponse {
  return {
    uid: "my-uid",
    uid_hash: "uid-hash",
    api_secret: "sooper-secret",
    account_created: (new Date()).toISOString(),
    is_admin: false,
    is_alias: false,
    platform: "Google",
    is_sandbox_user: false,
    email: "user@example.com",
    teams: [],
    groups: [],
    team_members: [],
    feature_flags: {
      uid: "my-uid",
      team_charts: false,
      group_charts: false,
      tb: false,
      fb: false
    },
    ...info
  };
}

