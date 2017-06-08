/*
  Init function that parses query params, returns props for component
*/

import * as _ from "lodash";
import { base as groupsRedirect } from "../groups.js/paths";
// import { base as agendaRedirect } from "../tb.js/paths";
import { base as timeRedirect } from "../time.js/paths";
import { AnalyticsSvc } from "../lib/analytics";
import { ApiSvc } from "../lib/api";
import * as ApiT from "../lib/apiT";
import { LocalStoreSvc }  from "../lib/local-store";
import * as Login from "../lib/login";
import { NavSvc } from "../lib/routing"
import { getParamByName, hasTag, hexDecode } from "../lib/util";
import { InvalidToken } from "../text/error-text";
import * as LoginText from "../text/login";
import { BaseProps, Message } from "./LoginContainer"
import * as Oauth from "./oauth";

type AllSvcs = ApiSvc & LocalStoreSvc & NavSvc & AnalyticsSvc;

/*
  Predefine query param names
*/
const params = {
  uid: "uid",
  message: "msg",
  error: "err",
  logout: "logout",
  email: "email",
  invite: "invite",
  platform: "platform",
  redirect: "redirect",
  staging: "staging",
  token: "token"
};

interface LocationLite {
  search: string;
  origin: string;
}

// Init function to parse query params, returns props for component
export function init(l: LocationLite, Svcs: AllSvcs): Promise<BaseProps> {

  // Log out
  if (getParamByName(params.logout, l.search)) {
    Oauth.logout(Svcs);
    return Promise.resolve({
      initMsg: ["message", LoginText.LogoutMsg] as Message
    });
  }

  // Staging login -> login with staged local store vals
  if (getParamByName(params.staging, l.search)) {
    let credentials = Login.getCredentials(Svcs);
    if (credentials) {
      Svcs.Api.setLogin({
        uid: credentials.uid,
        apiSecret: credentials.api_secret
      });
      return Svcs.Api.getLoginInfoWithRetry()
        .then((x) => handleLoginInfo(x, l, Svcs));
    }
  }

  // Login with UID + Nonce
  let uid = getParamByName(params.uid, l.search);
  if (uid) {
    return Oauth.loginOnce(uid, Svcs)
      .then((info) => handleLoginInfo(info, l, Svcs))
      .catch((err) => {
        if (err === Oauth.MISSING_NONCE) {
          return {
            initMsg: ["error", LoginText.NonceError] as Message
          };
        }
        throw err;
      });
  }

  // Login or display token as applicable
  let token = getParamByName(params.token, l.search);
  if (token) {
    return Svcs.Api.postToken(token).then((response) => {
      if (typeof response !== "string") {
        if (hasTag("Login", response.token_value)) {
          return handleLoginInfo(response.token_value[1], l, Svcs);
        }
        return { initMsg: ["message", LoginText.token(response)] as Message };
      }
      return { initMsg: ["error", InvalidToken] as Message };
    }).catch((err) => ({ initMsg: ["error", InvalidToken] as Message }));
  }

  let email = getParamByName(params.email, l.search);
  let invite = getParamByName(params.invite, l.search);
  let landingUrl = getLandingUrl(l);
  let platform = (getParamByName(params.platform, l.search) || "")
    .toLowerCase();

  // Auto-login for Google
  if (platform === "google") {
    return Oauth.loginWithGoogle({ email, invite, landingUrl }, Svcs)
      .then(() => ({ initView: { type: "REDIRECT" as "REDIRECT" }}));
  }

  // Auto-login for Nylas
  else if (platform === "nylas" && email) {
    return Oauth.loginWithNylas({ email, invite, landingUrl }, Svcs)
      .then(() => ({ initView: { type: "REDIRECT" as "REDIRECT" }}));
  }

  // Get any messages that need to be displayed, pass along invite codes
  // to login if necessary
  let errCode = getParamByName(params.error);
  let msgCode = getParamByName(params.message);
  let initMsg =
    (errCode && ["error", LoginText.error(errCode)] as Message) ||
    (msgCode && ["message", LoginText.message(msgCode)] as Message) ||
    ["message", LoginText.DefaultLoginMsg];
  return Promise.resolve({
    initMsg,
    initView: {
      type: "LOGIN" as "LOGIN",
      email, invite, landingUrl,
      initNylas: platform === "nylas",
    }
  });
}

// Helper function to handle, clean login info from promise
async function handleLoginInfo(
  info: ApiT.LoginResponse,
  l: LocationLite,
  Svcs: AllSvcs
): Promise<BaseProps> {
  Login.setCredentials(info, Svcs);
  if (info.platform === "Google") {
    let redirecting = await Oauth.checkGooglePermissions("", Svcs);
    if (redirecting) return { initView: { type: "REDIRECT" }};
  }

  // Get landingUrl for redirect (either from server, query para, or default)
  let landingUrl =
    info.landing_url ||
    getLandingUrl(l) ||
    getDefaultLandingUrl(info);

  // Check for team approval
  let team = _.find(info.teams,
    (t) => t.team_executive === info.uid && !t.team_approved
  );
  if (team) {
    let profileList = await Svcs.Api.getAllTeamProfiles();
    let profiles = profileList.profile_list.filter(
      (p) => p.profile_uid !== info.uid
    );

    return { initView: {
      type: "APPROVE_TEAM",
      team, profiles,
      redirect: landingUrl
    }};
  }

  // No issues, redirect to landing page
  Svcs.Nav.go(cleanLandingUrl(landingUrl, l));
  return { initView: { type: "REDIRECT" }};
}

// Extract landing URL from params -- returns undefined otherwise
function getLandingUrl(l: LocationLite) {
  let r = getParamByName(params.redirect, l.search);
  if (r) {
    return hexDecode(r);
  }
  return undefined;
}

// If we're logged in with no redirect, where to next?
function getDefaultLandingUrl(info: ApiT.LoginResponse) {
  if (info.groups && info.groups.length) {
    return groupsRedirect;
  }
  return timeRedirect;

  /*
    Don't redirect to agenda unless explicit. At least not yet.
  */

  // if (info.teams && !!_.find(info.teams,
  //   (t) => t.team_executive !== info.uid ||t.team_api.team_labels.length)
  // ) {
  //   return timeRedirect;
  // }

  // return agendaRedirect;
}

/*
  We only allow redirects to the same domain as this login page (for
  safety). If redirect path is already same origin, remove to get path
  without origin. Else we'll redirect to something like
  https://esper.com/https://esper.com/path/to/thing
*/
function cleanLandingUrl(url: string, l: LocationLite) {
  if (_.startsWith(url, l.origin)) {
    return url;
  } else if (url[0] === "/") {
    return url;
  }
  return "/" + url;
}

export default init;