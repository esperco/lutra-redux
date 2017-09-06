import { isAjaxError, default as JsonHttp } from "./json-http";
import * as ApiT from "./apiT";
import * as Log from "./log";
import * as Util from "./util";
import * as moment from "moment";

namespace Api {
  // Change prefix via init function
  export var prefix = "";
  export var uid = "";

  export interface Config extends JsonHttp.Config {
    apiPrefix: string;
  }

  export function init(opts: Config) {
    prefix = opts.apiPrefix;
    JsonHttp.init(opts);
  }

  export function reset() {
    uid = "";
  }

  export function setLogin(credentials: {
    uid: string;
    apiSecret: string;
  }) {
    uid = credentials.uid;
    JsonHttp.setSecret(credentials.apiSecret);
  }

  export var setOffset = JsonHttp.setOffset;

  /*
    We call this to avoid making URLs containing "undefined" or "null".
    This prevents making a bogus API request, and hopefully makes bug
    detection and prevention easier.

    This URL-encodes the string, as needed.
  */
  function string(x: string) {
    Log.assert(x !== undefined && x !== null);
    return encodeURIComponent(x);
  }

  // function number(x: number): string {
  //   console.assert(x !== undefined && x !== null);
  //   return x.toString();
  // }

  function myUid(): string {
    if (uid) return string(uid);
    throw new Error("UID required but not set");
  }

  export function clock(): Promise<ApiT.ClockResponse> {
    return JsonHttp.get(prefix + "/clock");
  }

  export function echo(serializable: any) {
    return JsonHttp.post(prefix + "/echo",
                         serializable);
  }

  export function random(): Promise<ApiT.Random> {
    return JsonHttp.post(prefix + "/api/random");
  }

  /* Batch helpers */

  export function batch<T>(fn: () => Promise<T>): Promise<T>;
  export function batch<T>(fn: () => T): Promise<T>;
  export function batch<T>(fn: () => T|Promise<T>): Promise<T> {
    return JsonHttp.batch(fn, prefix + "/http-batch-request");
  }


  /* Login */

  export function loginOnce(uid: string, loginNonce: string):
    Promise<ApiT.LoginResponse>
  {
    return batch(() => {
      let ret: Promise<ApiT.LoginResponse> = JsonHttp.post(
        prefix + "/api/login/" + string(uid) + "/once/" + string(loginNonce),
        "");
      let fixOffset = clock().then((v) => {
        setOffset(moment(v.timestamp).diff(moment(), 'seconds'));
      });
      return fixOffset.then(() => ret);
    });
  }

  // NB: Gets personal teams only by default
  export function getLoginInfo(): Promise<ApiT.LoginResponse> {
    var url = prefix + "/api/login/" + myUid() + "/info" +
      "?filter_groups_only=false";
    return JsonHttp.get(url);
  }

  // Like getLoginInfo, but retries after fixing clock offset
  export function getLoginInfoWithRetry(): Promise<ApiT.LoginResponse> {
    var url = prefix + "/api/login/" + myUid() + "/info" +
      "?filter_groups_only=false";
    return JsonHttp.get(url, (err) => {
      if (isAjaxError(err) && err.details &&
          err.details.tag === "Invalid_authentication_headers") {
        return clock().then((v) => {
          setOffset(moment(v.timestamp).diff(moment(), 'seconds'));
          return getLoginInfo();
        });
      }
      throw err;
    });
  }

  export function getGoogleAuthUrl(opts: {
    nonce: string;
    email?: string;
    invite?: string;
    landingUrl?: string;
  }): Promise<ApiT.UrlResult> {
    let url = prefix + "/api/google-auth-url";
    let q: string[] = ["login_nonce=" + encodeURIComponent(opts.nonce)];
    if (opts.landingUrl) {
      q.push("auth_landing=" + encodeURIComponent(opts.landingUrl));
    }
    if (opts.invite) {
      q.push("invite=" + encodeURIComponent(opts.invite));
    }
    if (opts.email) {
      q.push("login_hint=" + encodeURIComponent(opts.email));
    }
    return JsonHttp.get(url + "?" + q.join("&"));
  }

  export function getGoogleAuthInfo(landingUrl: string):
    Promise<ApiT.GoogleAuthInfo>
  {
    let url = prefix + "/api/google/" + myUid() + "/auth/info"
      + "?auth_landing=" + encodeURIComponent(landingUrl);
    return JsonHttp.get(url);
  }

  export function getNylasLoginUrl(opts: {
    nonce: string;
    email: string;
    invite?: string;
    landingUrl?: string;
  }): Promise<ApiT.UrlResult> {
    let url = prefix + "/api/nylas/login/" + string(opts.email);
    let q: string[] = ["nonce=" + encodeURIComponent(opts.nonce)];
    if (opts.landingUrl) {
      q.push("landing_url=" + encodeURIComponent(opts.landingUrl));
    }
    if (opts.invite) {
      q.push("invite=" + encodeURIComponent(opts.invite));
    }
    return JsonHttp.get(url + "?" + q.join("&"), (err) => {
      // Redirect to Google OAuth if wrong URL
      if (isAjaxError(err) && err.details &&
          err.details.tag === "Use_google_oauth") {
        return getGoogleAuthUrl(opts);
      }
      throw err;
    });
  }

  export function getSlackAuthInfo(teamId: string):
    Promise<ApiT.SlackAuthInfo>
  {
    let url = prefix + "/api/slack/auth-info/" + myUid() + "/" + string(teamId);
    return JsonHttp.get(url);
  }

  export function getFeatureFlags(uid?: string): Promise<ApiT.FeatureFlagsApi> {
    let url = `${prefix}/api/feature-flags/${myUid()}/${uid || myUid()}`;
    return JsonHttp.get(url);
  }

  export function patchFeatureFlags(
    flags: Partial<ApiT.FeatureFlags>,
    uid?: string
  ): Promise<ApiT.FeatureFlagsApi> {
    let url = `${prefix}/api/feature-flags/${myUid()}/${uid || myUid()}`;
    return JsonHttp.patch(url, flags);
  }


  /* Teams */

  export function createTeam(body: ApiT.TeamCreationRequest)
    : Promise<ApiT.Team>
  {
    let url = prefix + "/api/team-create/" + myUid();
    return JsonHttp.post(url, body);
  }

  export function setTeamName(teamId: string, name: string):
    Promise<void> {
    return JsonHttp.put(prefix + "/api/team-name/" + myUid()
      + "/" + string(teamId)
      + "/" + string(name),
      "");
  }

  export function approveTeam(teamId: string): Promise<void> {
    return JsonHttp.put(prefix + "/api/team-approve/" + myUid() +
      "/" + string(teamId) + "/true");
  }

  export function getAllTeamProfiles(): Promise<ApiT.ProfileList> {
    let url = prefix + "/api/profile/" + myUid();
    return JsonHttp.get(url);
  }


  /* Groups */

  // Fetch all groups for user
  export function getGroupsByUid(uid: string, opts: {
      withMembers?: boolean,
      withLabels?: boolean
    }): Promise<ApiT.GroupList>
  {
    var query = opts.withMembers || opts.withLabels ? "?" : "";
    var membersParam = opts.withMembers ? "members=true" : "";
    var labelsParam = opts.withLabels ? "labels=true" : "";
    var paramString = query + (opts.withMembers && opts.withLabels ?
                               membersParam + "&" + labelsParam :
                               membersParam + labelsParam);
    var url = prefix + "/api/group/user/" + myUid()
      + "/" + string(uid)
      + paramString;
    return JsonHttp.get(url);
  }

  export function getGroupDetails(groupid: string, opts: {
      withMembers?: boolean,
      withLabels?: boolean
    } = {}): Promise<ApiT.Group>
  {
    var query = opts.withMembers || opts.withLabels ? "?" : "";
    var membersParam = opts.withMembers ? "members=true" : "";
    var labelsParam = opts.withLabels ? "labels=true" : "";
    var paramString = query + (opts.withMembers && opts.withLabels ?
                               membersParam + "&" + labelsParam :
                               membersParam + labelsParam);
    var url = `${prefix}/api/group/details/${myUid()}/`
      + `${string(groupid) + paramString}`;
    return JsonHttp.get(url);
  }

  export function patchGroupDetails(groupid: string, p: ApiT.GroupUpdatePatch):
    Promise<ApiT.Group>
  {
    var url = `${prefix}/api/group/details/${myUid()}/${string(groupid)}`;
    return JsonHttp.patch(url, p);
  }

  export function createGroup(
    groupUpdate: ApiT.GroupUpdate
  ): Promise<ApiT.Group>;
  export function createGroup(
    adminUid: string,
    groupUpdate: ApiT.GroupUpdate
  ): Promise<ApiT.Group>;
  export function createGroup(
    firstArg: string|ApiT.GroupUpdate,
    secondArg?: ApiT.GroupUpdate
  ): Promise<ApiT.Group> {
    let adminUid: string;
    let groupUpdate: ApiT.GroupUpdate;
    if (typeof firstArg === "string") {
      adminUid = firstArg;
      groupUpdate = secondArg!;
    } else {
      adminUid = myUid();
      groupUpdate = firstArg;
    }
    let url = prefix + "/api/group/create/" + myUid()
      + "/" + string(adminUid);
    return JsonHttp.post(url, groupUpdate);
  }

  export function renameGroup(groupid: string, groupName: string):
    Promise<void>
  {
    var url = prefix + "/api/group/group-name/" + myUid()
      + "/" + string(groupid)
      + "/" + string(groupName);
    return JsonHttp.put(url);
  }

  export function deleteGroup(groupId: string): Promise<void> {
    var url = prefix + "/api/group/delete/" + myUid()
      + "/" + string(groupId);
    return JsonHttp.delete_(url);
  }

  export function putGroupIndividual(groupid: string, uid: string, opts: {
    role?: string,
    resendNotif?: boolean
  } = {}): Promise<ApiT.GroupIndividual>
  {
    var query = opts.role || opts.resendNotif ? "?" : "";
    var roleParam = opts.role ? "role=" + opts.role : "";
    var resendParam = opts.resendNotif ? "resend_notif=true" : "";
    var paramString = query + (opts.role && opts.resendNotif ?
                               roleParam + "&" + resendParam :
                               roleParam + resendParam);
    var url = prefix + "/api/group/individual-member/" + myUid()
      + "/" + string(groupid)
      + "/" + string(uid)
      + paramString;
    return JsonHttp.put(url);
  }

  export function putSelfTeamAsGroupMember(groupId: string):
    Promise<ApiT.GroupMember>
  {
    var url = `${prefix}/api/group/self-team/${myUid()}/${string(groupId)}`;
    return JsonHttp.put(url);
  }

  export function putGroupIndividualByEmail(
    groupid: string,
    email: string,
    opts: {
      role?: string,
      resendNotif?: boolean
    } = {}
  ): Promise<ApiT.GroupInviteResponse> {
    var query = opts.role || opts.resendNotif ? "?" : "";
    var roleParam = opts.role ? "role=" + opts.role : "";
    var resendParam = opts.resendNotif ? "resend_notif=true" : "";
    var paramString = query + (opts.role && opts.resendNotif ?
                               roleParam + "&" + resendParam :
                               roleParam + resendParam);
    var url = prefix + "/api/group/individual-member/" + myUid()
      + "/" + string(groupid)
      + "/email/" + string(email)
      + paramString;
    return JsonHttp.put(url);
  }

  export function removeGroupIndividual(groupid: string, uid: string):
    Promise<void>
  {
    var url = `${prefix}/api/group/individual-member/${myUid()}`
      + `/${string(groupid)}/${string(uid)}`;
    return JsonHttp.delete_(url);
  }

  export function removeGroupMember(groupid: string, teamid: string):
    Promise<void>
  {
    var url = `${prefix}/api/group/member/${myUid()}`
      + `/${string(groupid)}/${string(teamid)}`;
    return JsonHttp.delete_(url);
  }

  export function putGroupLabels(
    groupid: string,
    labels: {labels: string[]}
  ): Promise<void> {
    var url = prefix + "/api/group/labels/" + myUid()
      + "/" + string(groupid);
    return JsonHttp.put(url, labels);
  }

  export function setGroupLabelColor(
    groupid: string, req: ApiT.SetLabelColorRequest
  ): Promise<ApiT.LabelInfo> {
    var url = `${prefix}/api/group-label/set-color/${myUid()}`
      + `/${string(groupid)}`;
    return JsonHttp.post(url, req);
  }

  export function putGroupTimezone(groupid: string, timezone: string):
    Promise<ApiT.Group>
  {
    var url = `${prefix}/api/group/timezone/${string(myUid())}/`
      + `${string(groupid)}/${string(timezone)}`;
    return JsonHttp.put(url);
  }


  /* Group Preferences */

  export function getGroupPreferences(groupid: string):
    Promise<ApiT.GroupPreferences>
  {
    var url = `${prefix}/api/group/preferences/${myUid()}/${string(groupid)}`;
    return JsonHttp.get(url);
  }

  export function putGroupPreferences(
    groupid: string,
    prefs: ApiT.GroupPreferences
  ): Promise<void> {
    var url = `${prefix}/api/group/preferences/${myUid()}/${groupid}`;
    return JsonHttp.put(url, prefs);
  }


  /* Calendars */

  export function getTimestatsCalendarList(teamid: string):
    Promise<ApiT.GenericCalendars> {
    var url =
      `${prefix}/api/ts/ts-calendars/${myUid()}/${string(teamid)}`;
    return JsonHttp.get(url);
  }

  export function getGenericCalendarList(teamid: string):
    Promise<ApiT.GenericCalendars> {
    var url = `${prefix}/api/ts/calendars/${myUid()}/${string(teamid)}`;
    return JsonHttp.get(url);
  }

  export function putTeamTimestatsCalendars(teamid: string, cals: string[]):
    Promise<ApiT.Team>
  {
    var url = `${prefix}/api/team/${string(myUid())}`
            + `/${string(teamid)}/ts-calendars`;
    return JsonHttp.put(url, { calendars: cals });
  }

  /* Preferences */

  export function getPreferences(teamid: string):
  Promise<ApiT.Preferences> {
    let url = prefix + "/api/preferences/" + myUid() + "/" + string(teamid);
    return JsonHttp.get(url);
  }

  export function putPreferences(teamid: string, prefs: ApiT.Preferences):
  Promise<void> {
    let url = prefix + "/api/preferences/" + myUid() + "/" + string(teamid);
    return JsonHttp.put(url, prefs);
  }

  /* Events */

  export function postForTeamEvents(teamId: string, q: ApiT.CalendarRequest):
    Promise<ApiT.GenericCalendarEvents>
  {
    var url = prefix + "/api/ts/events-team/" + myUid()
            + "/" + string(teamId);
    return JsonHttp.postGet(url, q);
  }

  export function postForGroupEvents(groupId: string, q: ApiT.CalendarRequest):
    Promise<ApiT.GenericCalendarEvents>
  {
    var url = prefix + "/api/ts/events-group/" + myUid()
            + "/" + string(groupId);
    return JsonHttp.postGet(url, q);
  }

  /*
    Try to get event for a given calgroup, return null if does not exist
  */

  export function getTeamEvent(teamId: string, eventId: string):
    Promise<ApiT.GenericCalendarEvent|null>
  {
    var url = `${prefix}/api/ts/event/${myUid()}`
      + `/${string(eventId)}`
      + `?teamid=${string(teamId)}`;
    return JsonHttp.get(url).then((t: ApiT.EventLookupResponse) => {
      if (t.result && t.result.teamid === teamId) {
        return t.result.event
      }
      return null;
    });
  }

  export function getGroupEvent(groupId: string, eventId: string):
    Promise<ApiT.GenericCalendarEvent|null>
  {
    let url = prefix + "/api/group/ts/event/" + myUid()
            + "/" + string(groupId) + "/" + string(eventId);
    return JsonHttp.get(url, (err) => {
      if (isAjaxError(err) && err.details &&
          err.details.tag === "No_such_group_event") {
        return null;
      }
      throw err;
    });
  }


  /* Labeling */

  export function setPredictGroupLabels(
    groupId: string,
    req: ApiT.LabelsSetPredictRequest
  ) : Promise<ApiT.GenericCalendarEvents> {
    var url = prefix + "/api/group/event/labels/set-predict/" + myUid()
            + "/" + string(groupId);
    return JsonHttp.post(url, req);
  }


  /* Timebomb */

  export function setGroupTimebomb(
    groupId: string, eventId: string, value: boolean
  ) : Promise<void> {
    let url = prefix + `/api/group/set-timebomb/${myUid()}` +
      `/${string(groupId)}/${string(eventId)}`;
    return JsonHttp.put(url, { value } as ApiT.BoolRequest);
  }

  export function setTeamTimebomb(
    teamId: string, eventId: string, value: boolean
  ) : Promise<void> {
    let url = prefix + `/api/team/set-timebomb/${myUid()}` +
      `/${string(teamId)}/${string(eventId)}`;
    return JsonHttp.put(url, { value } as ApiT.BoolRequest);
  }

  export function confirmGroupEvent(
    groupId: string, eventId: string, blurb?: string
  ) : Promise<void> {
    let url = `${prefix}/api/group/confirm-event/`
            + `${myUid()}/${string(groupId)}/${string(eventId)}`;
    return JsonHttp.put(url, { blurb } as ApiT.GuestContribution);
  }

  export function unconfirmGroupEvent(groupId: string, eventId: string)
  : Promise<void> {
    let url = `${prefix}/api/group/unconfirm-event/`
            + `${myUid()}/${string(groupId)}/${string(eventId)}`;
    return JsonHttp.put(url);
  }

  export function confirmTeamEvent(
    teamId: string, eventId: string, blurb?: string
  ) : Promise<void> {
    let url = `${prefix}/api/team/confirm-event/`
            + `${myUid()}/${string(teamId)}/${string(eventId)}`;
    return JsonHttp.put(url, { blurb } as ApiT.GuestContribution);
  }

  export function unconfirmTeamEvent(teamId: string, eventId: string)
  : Promise<void> {
    let url = `${prefix}/api/team/unconfirm-event/`
            + `${myUid()}/${string(teamId)}/${string(eventId)}`;
    return JsonHttp.put(url);
  }


  /* Feedback */

  export function setGroupFeedbackPref(
    groupId: string, eventId: string, value: boolean
  ) : Promise<void> {
    let url = prefix + `/api/group/set-fb-pref/${myUid()}` +
      `/${string(groupId)}/${string(eventId)}`;
    return JsonHttp.put(url, { value } as ApiT.BoolRequest);
  }

  export function setTeamFeedbackPref(
    teamId: string, eventId: string, value: boolean
  ) : Promise<void> {
    let url = prefix + `/api/team/set-fb-pref/${myUid()}` +
      `/${string(teamId)}/${string(eventId)}`;
    return JsonHttp.put(url, { value } as ApiT.BoolRequest);
  }


  /* Export */

  export async function postForGroupCalendarEventsCSV(
    groupId: string,
    q: ApiT.CalendarRequest
  ): Promise<string> {
    let path = prefix + "/api/group/ts/events-csv/" + string(myUid())
      + "/" + string(groupId);
    let { respBody } = await JsonHttp.rawHttp({
      method: "POST",
      path,
      body: JSON.stringify(q),
      contentType: "application/json; charset=UTF-8"
    });
    return respBody;
  }


  /* Tokens */

  type TokenErr = "Invalid_token"|"Expired_token";

  function ignoreTokenErr(err: Error): TokenErr {
    if (isAjaxError(err) && err.details &&
        (err.details.tag === "Invalid_token" ||
         err.details.tag === "Expired_token")) {
      return err.details.tag;
    }
    throw err;
  }

  export function getToken(token: string): Promise<ApiT.TokenInfo|TokenErr> {
    return JsonHttp.get(
      prefix + "/api/token/" + string(token),
      ignoreTokenErr
    );
  }

  /*
    Base function for post token variants below (which type-check different
    types of bodies to pass along with token).
  */
  function _postToken(
    token: string, body?: any
  ): Promise<ApiT.TokenResponse|TokenErr> {
    return JsonHttp.post(
      prefix + "/api/token/" + string(token),
      body,
      ignoreTokenErr
    );
  }

  export function postToken(token: string) { return _postToken(token); }
  export function postConfirmToken(
    token: string, body: ApiT.GuestContribution
  ) {
    return _postToken(token, body);
  }
  export function postRatingsToken<K extends keyof ApiT.EventFeedback>(
    token: string, body: ApiT.GuestEventFeedbackPatch<K>
  ) {
    return _postToken(token, body);
  }

  /* Invites */

  export function getInviteEmails() : Promise<ApiT.EmailAddresses> {
    let url = prefix + "/api/invite/emails/" + myUid();
    return JsonHttp.get(url);
  }


  /* Misc */

  export function sandboxSignup(): Promise<ApiT.LoginResponse> {
    var url = prefix + "/api/sandbox/signup";
    return JsonHttp.post(url, "");
  }

  export function sendSupportEmail(msg: string): Promise<void> {
    var url = prefix + "/api/support/email";
    var feedback: { body: string, user?: string } = { body: msg };
    if (uid) {
      url += ("/" + uid);
      feedback.user = uid;
    }
    return JsonHttp.post(url, feedback);
  }
}

export interface ApiSvc {
  Api: typeof Api;
}

export default Api;

(self as any).Api = Api;
