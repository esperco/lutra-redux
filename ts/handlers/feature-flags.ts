/*
  Set feature flags
*/

import { isEqual } from "lodash";
import { ApiSvc } from "../lib/api";
import * as ApiT from "../lib/apiT";
import { LoginState, FeatureFlagAction } from "../lib/login";

export async function ensureFlags(flags: Partial<ApiT.FeatureFlags>, deps: {
  dispatch: (action: FeatureFlagAction) => void;
  state: LoginState;
  Svcs: ApiSvc;
}, force = false) {
  // Check if update necessary
  let { state } = deps;
  let shouldUpdate = force || (state.login && !isEqual(
    { ...state.login.feature_flags, ...flags },
    state.login.feature_flags
  ));
  if (state.loggedInAsAdmin) shouldUpdate = false;
  if (! shouldUpdate) return state.login ? state.login.feature_flags : {};

  // Optimist UI update
  deps.dispatch({ type: "FEATURE_FLAG", flags });

  // Post API, get new flags
  flags = await deps.Svcs.Api.patchFeatureFlags(flags);

  // Update with server-reported flag state
  deps.dispatch({ type: "FEATURE_FLAG", flags });

  return flags;
}