/*
  Login using locally stored credentials.
*/

// Credentials => retrieve stored credentials from LocalStorage
import { LocalStoreSvc } from "./local-store";
import { ApiSvc } from "./api";
import { NavSvc } from "./routing";
import * as moment from "moment";
import * as ApiT from "./apiT";
import * as _ from "lodash";
import * as $ from "jquery";

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
  Svcs: LocalStoreSvc & ApiSvc & NavSvc
) {
  let credentials = getCredentials(Svcs);
  let { Api, Nav } = Svcs;
  if (credentials) {
    Api.setLogin({ 
      uid: credentials.uid,
      apiSecret: credentials.api_secret
    });

    var asAdmin = !!credentials.as_admin;
    return Api.getLoginInfo()

      // Fix offset based on clock result if invalid headers and try again
      .then((info) => info, (err) => {
        if (err.details && 
            err.details.tag === "Invalid_authentication_headers") {
          err.handled = true;
          return Api.clock().then((v) => {
            Api.setOffset(moment(v.timestamp).diff(moment(), 'seconds'));
            return Api.getLoginInfo();
          });
        }
        throw err;    
      })
      
      // Success => dispatch info
      .then((info) => {
        dispatch({ type: "LOGIN", info, asAdmin });
        return info;
      },
      
      // Failure, redirect to login
      (err) => {
        Nav.go(Conf.loginRedirect);
        throw err;
      });
  }

  Nav.go(Conf.loginRedirect);
  return $.Deferred<ApiT.LoginResponse>().reject().promise();
}

