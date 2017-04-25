/*
  Login Oauth code. How it works:

  (1) User visits login page, tries to login with Google or Nylas.
  (2) Client generates a random nonce.
  (3) Client passes nonce to server and gets back Google or Nylas login URL.
  (4) Redirect to Google or Nylas.
  (5) Google or Nylas will send user back to login page with a UID.
  (6) Client exchanges UID + nonce for API secret, stores this in localStorage
      or a cookie.
  (7) If Google, may need to do additional check to see if permissions OK.
  (8) Redirect to next app page.
*/

import { AnalyticsSvc } from "../lib/analytics";
import { ApiSvc } from "../lib/api";
import { LocalStoreSvc } from "../lib/local-store";
import { NavSvc } from "../lib/routing";
import * as Util from "../lib/util";

// Local storage key for our login nonce
const nonceKey = "login_nonce";

/*
  How long to wait for analytics to post before redirecting to Google or
  Nylas. We need timeout because Segment's unavailability shouldn't break
  login for our app.
*/
const analyticsTimeout = 1500;

/*
  Cryptographic generation -- use web crypto if available, fall back to
  server crypto otherwise.
*/
function getRandom(Svcs: ApiSvc) {
  if (window.crypto) {
    return Promise.resolve(browserRandom());
  } else {
    return Svcs.Api.random().then((x) => {
      if (x.random.length > 64) return x.random;
      throw new Error("Nonce too short, has length " + x.random.length)
    });
  }
}

// Generates a random string of a certain length
function browserRandom(length=128) {
  let values = new Uint8Array(length);
  window.crypto.getRandomValues(values);
  let result = "";
  for(let i = 0; i < values.length; i++) {
    result += charSet[values[i] % charSet.length];
  }
  return result;
}

// Values for browserRandom
const charSet =
  "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ-_";

// Create and store nonce in local storage
function setLoginNonce(Svcs: ApiSvc & LocalStoreSvc) {
  return getRandom(Svcs)
    .then((x) => {
      Svcs.LocalStore.set(nonceKey, x);
      return x;
    });
}

// Retrieve nonce from storage
function getLoginNonce(Svcs: LocalStoreSvc): string|undefined {
  return Svcs.LocalStore.get(nonceKey);
}

// Clear nonce (after use)
function clearLoginNonce(Svcs: LocalStoreSvc) {
  Svcs.LocalStore.remove(nonceKey);
}

interface LoginOpts {
  landingUrl?: string;
  invite?: string;
  email?: string;
}

// Shared analytics code for Google / Nylas
export function trackLogin(
  platform: "Google"|"Nylas",
  opts: LoginOpts,
  Svcs: AnalyticsSvc
) {
  var analyticsP1 = Util.timeoutP(analyticsTimeout);
  if (opts.email) {
    Svcs.Analytics.preIdentify({
      email: opts.email,
      platform
    }, analyticsP1.cb);
  }

  var analyticsP2 = Util.timeoutP(analyticsTimeout);
  Svcs.Analytics.track(["AttemptLogin", { platform }], analyticsP2.cb);

  return Promise.all([analyticsP1, analyticsP2])
    .catch((err) => {} /* Ignore analytics failures*/ );
}

// Redirect to Google OAuth
export function loginWithGoogle(
  opts: LoginOpts,
  Svcs: AnalyticsSvc & ApiSvc & LocalStoreSvc & NavSvc
): Promise<void> {
  var analyticsP = trackLogin("Google", opts, Svcs);
  return setLoginNonce(Svcs)
    .then((nonce) => Svcs.Api.getGoogleAuthUrl({ nonce, ...opts }))
    .then((x) => analyticsP.then(() => Svcs.Nav.go(x.url)));
}

// Second check to see if we need more Google Oauth permissions
export function checkGooglePermissions(
  landingUrl: string,
  Svcs: AnalyticsSvc & ApiSvc & LocalStoreSvc & NavSvc
) {
  // Landing URL => prefix with base URL (landingUrl format for
  // getGoogleAuthInfo is a little different than getGoogleAuthUrl)
  landingUrl = location.origin + "/" + landingUrl;
  return Svcs.Api.getGoogleAuthInfo(landingUrl).then((info) => {
    if (info.need_google_auth) {
      Svcs.Nav.go(info.google_auth_url);
      return true;
    }
    else
      return false;
  });
}

// Redirect to Nylas OAuth
export function loginWithNylas(
  opts: LoginOpts & { email: string }, // Make email required
  Svcs: AnalyticsSvc & ApiSvc & LocalStoreSvc & NavSvc
): Promise<void> {
  var analyticsP = trackLogin("Nylas", opts, Svcs);
  return setLoginNonce(Svcs)
    .then((nonce) => Svcs.Api.getNylasLoginUrl({ nonce, ...opts }))
    .then((x) => analyticsP.then(() => Svcs.Nav.go(x.url)));
}

export const MISSING_NONCE = new Error("Login nonce missing");

/*
  This should be triggered after callback from OAuth -- returns promise
  with loginInfo. Used instead of Login.init.
*/
export function loginOnce(
  uid: string,
  Svcs: ApiSvc & LocalStoreSvc
) {
  var loginNonce = getLoginNonce(Svcs);
  if (! loginNonce) {
    return Promise.reject(MISSING_NONCE);
  }
  clearLoginNonce(Svcs);
  return Svcs.Api.loginOnce(uid, loginNonce);
}

/*
  Clear login data
*/
export function logout(Svcs: ApiSvc & LocalStoreSvc & AnalyticsSvc) {
  Svcs.LocalStore.clear();
  Svcs.Analytics.reset();
  Svcs.Api.reset();
}
