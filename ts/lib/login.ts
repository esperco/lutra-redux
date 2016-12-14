/*
  Login using locally stored credentials.
*/

// Credentials => retrieve stored credentials from LocalStorage
import { LocalStoreSvc } from "./local-store";
import { AnalyticsSvc } from "./analytics";
import { ApiSvc } from "./api";
import { NavSvc } from "./routing";
import * as ApiT from "./apiT";
import * as _ from "lodash";

const storedLoginKey = "login";

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

// Returns a promise for when login process is done -- dispatches to store
export function init(
  dispatch: (action: LoginAction) => LoginAction,
  Conf: { loginRedirect: string },
  Svcs: LocalStoreSvc & ApiSvc & NavSvc & AnalyticsSvc
): Promise<ApiT.LoginResponse> {
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
        dispatch({ type: "LOGIN", info, asAdmin });
        if (asAdmin) { Analytics.disabled = true; }
        else { Analytics.identify(info); }
        return info;
      },

      // Failure, redirect to login
      (err) => {
        Nav.go(Conf.loginRedirect);
        throw err;
      });
  }

  Nav.go(Conf.loginRedirect);
  return new Promise(function() {}); // Never resolves -- waiting for redirect
}

