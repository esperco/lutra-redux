/*
  Login using locally stored credentials.
*/

// Credentials => retrieve stored credentials from LocalStorage
import { LocalStoreSvc } from "./local-store";
import { AnalyticsSvc } from "./analytics";
import { ApiSvc } from "./api";
import * as ApiT from "./apiT";
import { NavSvc } from "./routing";
import { hexEncode } from "./util";
import * as _ from "lodash";

// LocalStorage Keys
export const storedLoginKey = "login";

export interface StoredCredentials {
  uid: string;
  api_secret: string;
  email: string;
  as_admin?: boolean;
}

export interface LoginState {
  login?: ApiT.LoginResponse;
  loggedInAsAdmin?: boolean;
}

export interface LoggedInState {
  login: ApiT.LoginResponse;
}

export interface LoginAction {
  type: "LOGIN";
  info: ApiT.LoginResponse;
  asAdmin?: boolean;
}

export function loginReducer<S extends LoginState>(
  state: S, action: LoginAction
) {
  state = _.clone(state);
  state.login = action.info;
  state.loggedInAsAdmin = action.asAdmin;
  return state;
}

export interface FeatureFlagAction {
  type: "FEATURE_FLAG";
  flags: Partial<ApiT.FeatureFlags>;
}

export function featureFlagsReducer<S extends LoginState>(
  state: S, action: FeatureFlagAction
) {
  state = _.clone(state);
  if (state.login) {
    state.login = {
      ...state.login,
      feature_flags: {
        ...state.login.feature_flags,
        ...action.flags
      }
    };
  }
  return state;
}

// Grab credentials from local storage
export function getCredentials(svcs: LocalStoreSvc): StoredCredentials|null {
  let credentials = svcs.LocalStore.get(storedLoginKey);
  if (credentials &&
      _.isString(credentials.uid) &&
      _.isString(credentials.email)) {
    let typedCredentials: StoredCredentials = credentials;
    typedCredentials.as_admin = !!typedCredentials.as_admin;
    return typedCredentials;
  }
  return null;
}

// Store new login info + init API
export function setCredentials(
  info: StoredCredentials,
  svcs: LocalStoreSvc & ApiSvc
) {
  svcs.LocalStore.set(storedLoginKey, {
    uid: info.uid,
    api_secret: info.api_secret,
    email: info.email
  } as StoredCredentials);

  svcs.Api.setLogin({
    uid: info.uid,
    apiSecret: info.api_secret
  });
}

const sandboxError = new Error("Sandbox");

// Never resolves -- waiting for redirect
const redirectPromise = new Promise(function() {});

// Returns a promise for when login process is done -- dispatches to store
export function init(
  dispatch: (action: LoginAction) => any,
  Conf: { loginRedirect: string|((hexPath: string) => string) },
  Svcs: LocalStoreSvc & ApiSvc & NavSvc & AnalyticsSvc,
  allowSandbox = false
): Promise<ApiT.LoginResponse> {
  let redirect = typeof Conf.loginRedirect === "string" ?
    Conf.loginRedirect :
    Conf.loginRedirect(hexEncode(location.pathname + location.hash));
  let credentials = getCredentials(Svcs);
  let { Analytics, Api, Nav } = Svcs;
  if (credentials) {
    Api.setLogin({
      uid: credentials.uid,
      apiSecret: credentials.api_secret
    });

    var asAdmin = !!credentials.as_admin;
    return Api.getLoginInfoWithRetry()

      // Success => identify, dispatch info
      .then((info) => {
        if (info.is_sandbox_user && !allowSandbox) {
          throw sandboxError
        }

        dispatch({ type: "LOGIN", info, asAdmin });
        if (asAdmin) { Analytics.disabled = true; }
        else { Analytics.identify(info); }

        // Intercom -> pass settings manually in case Segment is blocked. Wait
        // 10 seconds so as not to interfere with normal Segment loading process
        if (!info.is_sandbox_user && !info.is_admin) {
          setTimeout(() => {
            (<any> window).intercomSettings =
              (<any> window).intercomSettings || {};
            (<any> window).intercomSettings.user_id = info.uid;
            (<any> window).intercomSettings.user_hash = info.uid_hash;
            (<any> window).intercomSettings.email = info.email;
            if ((<any> window).Intercom) { // Make sure intercom is loaded
              (<any> window).Intercom("update",
                (<any> window).intercomSettings);
            }
          }, 10000);
        }
        return info;
      }).catch((err) => { // Failure, redirect to login
        Nav.go(redirect);
        if (err === sandboxError) {
          return redirectPromise;
        } else {
          throw err;
        }
      });
  }

  Nav.go(redirect);
  return redirectPromise;
}

