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

  export function getLoginInfo(): Promise<ApiT.LoginResponse> {
    var url = prefix + "/api/login/" + myUid() + "/info";
    return JsonHttp.get(url);
  }

  // Like getLoginInfo, but retries after fixing clock offset
  export function getLoginInfoWithRetry(): Promise<ApiT.LoginResponse> {
    var url = prefix + "/api/login/" + myUid() + "/info";
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

  // Fetch group details
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

  export function createGroup(uid: string, groupUpdate: ApiT.GroupUpdate):
    Promise<ApiT.Group>
  {
    var url = prefix + "/api/group/create/" + myUid()
      + "/" + string(uid);
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
}

export interface ApiSvc {
  Api: typeof Api;
}

export default Api;