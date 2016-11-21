/*
  Local storage using JSON serialization on top of the native string-based
  storage. This cache persists from one session to another.

  Values can be inspected and deleted with Firebug.
  Go to the DOM tab and scroll down to "localStorage".

  Falls back to using cookies if localStorage is unavailable.
*/

import * as Log from "./log";
import * as _ from "lodash";

namespace LocalStore {
  export function set(k: string, v: any) {
    var vStr = JSON.stringify(v);
    try {
      localStorage.setItem(k, vStr);
    }

    // Ignore error => always create cookie as backup
    catch (err) {}
    createCookie(k, vStr);
  };

  export function get(k: string): any {
    var s: string|undefined;
    try {
      let item = localStorage.getItem(k);

      // Check if we got anything back (in case of silent failure)
      if (typeof item !== "string") {
        throw new Error("localStorage failed to retrieve");
      } else {
        s = item;
      }
    }
    catch (err) {
      let cookie = readCookie(k);
      if (cookie) { s = cookie; }
    }

    var x: any;
    if (typeof s === "string") {
      try {
        x = JSON.parse(s);
      }
      catch (e) {
        Log.d("Cannot parse cached data stored under key '"+ k +"': "+ s);
      }
    }
    return x;
  };

  export function remove(k: string) {
    if (typeof localStorage !== 'undefined' && !!localStorage.removeItem) {
      try { localStorage.removeItem(k); }
      catch (err) { /* Nothing to do -- going to clear cookie anyway */ }
    }
    clearCookie(k);
  };

  export function clear() {
    if (window.localStorage && localStorage.clear) {
      localStorage.clear();
    }
  };


  /*
    LocalStorage is preferable to cookies because cookies get sent automatically
    to servers, but this is a fallback for systems that disable localStorage.

    Cookie is set to expire when browser closes -- this allows LocalStorage
    to be used for things like nonces, but there is no long-term persistence
  */

  /*
    Store value as cookie -- NB: the "; secure" flag means that this cookie
    will not be accessible to JS served over a non-HTTPS connection (e.g.
    localhost), but it should still be accessible to JS served over HTTPS
  */
  function createCookie(key: string, value: string) {
    document.cookie = key + "=" + value + "; path=/" +

      // Add secure flag unless we're on http (dev)
      (location.protocol === "http:" ? "" : "; secure");
  }

  // Read value as cookie
  function readCookie(key: string) {
    var nameEQ = key + "=";
    var ca = document.cookie.split(';');
    for (var i = 0, max = ca.length; i < max; i++) {
      var c = ca[i];
      c = _.trimStart(c);
      if (c.indexOf(nameEQ) === 0) {
        return c.substring(nameEQ.length, c.length);
      }
    }
    return null;
  }

  // Clear old cookie value
  function clearCookie(key: string) {
    document.cookie = key + "=" + "; expires=Thu, 01 Jan 1970 00:00:00 GMT";
  }
}

export interface LocalStoreSvc {
  LocalStore: typeof LocalStore;
};

export default LocalStore;