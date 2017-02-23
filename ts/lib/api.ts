import { isAjaxError, default as JsonHttp } from "./json-http";
import * as ApiT from "./apiT";
import * as Log from "./log";
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

  /* Batch helpers */

  export function batch<T>(fn: () => Promise<T>): Promise<T>;
  export function batch<T>(fn: () => T): Promise<T>;
  export function batch<T>(fn: () => T|Promise<T>): Promise<T> {
    return JsonHttp.batch(fn, prefix + "/http-batch-request");
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
    Promise<ApiT.GenericCalendarEventsCollection>
  {
    var url = prefix + "/api/ts/events-team/" + myUid()
            + "/" + string(teamId);
    return JsonHttp.postGet(url, q);
  }

  export function postForGroupEvents(groupId: string, q: ApiT.CalendarRequest):
    Promise<ApiT.GenericCalendarEventsCollection>
  {
    var url = prefix + "/api/ts/events-group/" + myUid()
            + "/" + string(groupId);
    return JsonHttp.postGet(url, q);
  }

  /*
    Try to get group event -- return null if it does not exist
  */
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

  export function getGroupEventComments(groupId: string, eventId: string):
    Promise<ApiT.GroupEventCommentList>
  {
    var url = `${prefix}/api/group/event-comment/${myUid()}`
            + `/${string(groupId)}/${string(eventId)}`;
    return JsonHttp.get(url);
  }

  export function postGroupEventComment(groupid: string, eventid: string,
                                        commentBody: ApiT.PostComment):
    Promise<ApiT.GroupEventComment>
  {
    var url = `${prefix}/api/group/event-comment/${myUid()}`
            + `/${string(groupid)}/${string(eventid)}`;
    return JsonHttp.post(url, commentBody);
  }

  export function deleteGroupEventComment(groupid: string, commentid: string):
    Promise<void>
  {
    var url = `${prefix}/api/group/comment-delete/${myUid()}`
            + `/${string(groupid)}/${string(commentid)}`;
    return JsonHttp.delete_(url);
  }

  export function upvoteGroupEventComment(groupid: string, commentid: string):
    Promise<void>
  {
    var url = `${prefix}/api/group/comment-upvote/${myUid()}`
            + `/${string(groupid)}/${string(commentid)}`;
    return JsonHttp.put(url);
  }

  export function removeUpvoteGroupEventComment(groupid: string,
                                                commentid: string):
    Promise<void>
  {
    var url = `${prefix}/api/group/remove-comment-upvote/${myUid()}`
            + `/${string(groupid)}/${string(commentid)}`;
    return JsonHttp.put(url);
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

  /* Invites */
  export function getInviteEmails() : Promise<ApiT.EmailAddresses> {
    let url = prefix + "/api/invite/emails/" + myUid();
    return JsonHttp.get(url);
  }
}

export interface ApiSvc {
  Api: typeof Api;
}

export default Api;

(self as any).Api = Api;