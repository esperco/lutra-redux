import JsonHttp from "./json-http";
import { Promise as JsonPromise } from "./json-http";
import * as ApiT from "./apiT";
import * as Log from "./log";

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

  export function clock(): JsonPromise<ApiT.ClockResponse> {
    return JsonHttp.get(prefix + "/clock");
  }

  export function echo(serializable: any) {
    return JsonHttp.post(prefix + "/echo",
                         serializable);
  }

  /* Batch helpers */

  export function batch<T>(fn: () => JQueryPromise<T>): JsonPromise<T>;
  export function batch<T>(fn: () => T): JsonPromise<T>;
  export function batch<T>(fn: () => T|JQueryPromise<T>): JsonPromise<T> {
    return JsonHttp.batch(fn, prefix + "/http-batch-request");
  }

  export function getLoginInfo(): JsonPromise<ApiT.LoginResponse> {
    var url = prefix + "/api/login/" + myUid() + "/info";
    return JsonHttp.get(url);
  }
}

export interface ApiSvc {
  Api: typeof Api;
}

export default Api;