/*
  Support for simple, type-checked hashbang routing
*/
import * as _ from 'lodash';
import * as Log from './log';
import { randomString } from "./util";

// Types of acceptable query or hash params
type Param = string|number|boolean|string[]|number[]|boolean[];
type ParamMap = {[index: string]: Param};

// See arraySeparator below
const DefaultArraySeparator = ",";

// Subset of window.location needed for mapping location to path
type LocationLite = {
  pathname: string;
  hash: string;
}

// A Path instance contains functions for creating a hash route
export class Path<P extends ParamMap> {
  constructor(public opts: {
    /*
      Prefix for our path -- added to our path function when calling
      href function -- can be used for base paths with a hash.
    */
    base: string;

    /*
      Object representing available params -- we can't ensure this
      type when coming in via URL input, so should clean input. Params
      are extracted from hash first, then querystring. This also functions
      as the default params if none are available
    */
    params: P;

    /*
      A list of hash components -- prefix with a `:` to denote as an argument.
      The argument will be checked against the `params` argument.
    */
    hash: string[];

    /*
      For representing arrays in string form -- e.g. ["a", "b"] is "a,b".
      Should pick some char strings will never include.
    */
    arraySeparator?: string;
  }) { }

  // Public path, for links and navigation
  href(p: P) {
    let base = this.opts.base;
    if (base[base.length - 1] === "/") { base = base.slice(0, -1); }

    // So we can delete stuff
    p = _.clone(p);

    let subPath = "/" + _.map(this.opts.hash, (h) => {
      if (h[0] === ":") {
        h = h.slice(1);
        let val = p[h];
        delete p[h];
        return this.toStr(val);
      } else {
        return h;
      }
    }).join("/");

    return base + "#!" + subPath +this.querystring(p);
  }

  // Convert a value to string for URL
  toStr(val: Param): string {
    if (typeof val === "string") {
      return encodeURIComponent(val);
    }

    else if (typeof val === "number") {
      return encodeURIComponent(val.toString());
    }

    else if (typeof val === "boolean") {
      return val ? "1" : "0";
    }

    else if (val instanceof Array && typeof val[0] !== "undefined") {
      let val2: Array<string|number|boolean> = val; // So _.map works
      let arraySep = this.opts.arraySeparator || DefaultArraySeparator;
      return _.map(val2, (v) => this.toStr(v)).join(arraySep);
    }

    throw new Error(`Invalid param type - ${JSON.stringify(val)}`);
  }

  // Format query string parameters
  querystring(p: P) {
    if (_.isEmpty(p)) return "";
    return "?" + _(p)
      .map((v: string, k: string) =>
        encodeURIComponent(k) + "=" + this.toStr(v)
      )
      .join("&");
  }

  // Convert val to type of key -- reverse of toStr
  parse<T extends Param>(type: T, val: string): T {
    if (typeof type === "string") {
      return <T> val;
    }

    else if (typeof type === "number") {
      return <T> parseFloat(val || "0");
    }

    else if (typeof type === "boolean") {
      return <T> !!parseInt(val);
    }

    else if (type instanceof Array && typeof type[0] !== "undefined") {
      let arraySep = this.opts.arraySeparator || DefaultArraySeparator;
      let values = val.split(arraySep);
      return <T> _.map(values, (v) => this.parse(type[0], v));
    }

    throw new Error(`Invalid param type - ${JSON.stringify(type)}`);
  }

  // Test if a given path string matches this one -- returns params if so,
  // null otherwise
  test(l: LocationLite) {
    if (l.pathname !== this.opts.base &&
        l.pathname !== "/" + this.opts.base) {
      return null;
    }

    /*
      We look at querystring AFTER hash (not a real querystring, just a way
      of using querystring params in hash)
    */
    let [hash, queryStr] = cleanHash(l.hash);

    // Pre-querystring portion of hash must match exactly (no optional args)
    let hashParts = hash.split('/');
    if (hashParts.length !== this.opts.hash.length) {
      return null;
    }

    // CLone params so we can use as default (and replace as appropriate)
    let ret = _.cloneDeep(this.opts.params);

    // Process hash parts first
    let zipped = _.zip(hashParts, this.opts.hash);
    for (let i in zipped) {
      let [actual, expected] = zipped[i];
      if (expected[0] === ":") { // Expect param argument
        let key = expected.slice(1);
        if (! ret.hasOwnProperty(key)) {
          Log.e("Unexpected param - " + key);
        }
        ret[key] = this.parse(ret[key], actual);
      }

      else if (actual !== expected) { // No match
        return null;
      }
    }

    // Fill remain params with querystring
    if (queryStr[0] === "?") { queryStr = queryStr.slice(1); }
    let queryParts = queryStr.split("&");
    _.each(queryParts, (part) => {
      let [key, element] = part.split("=");
      key = decodeURIComponent(key);
      element = decodeURIComponent(element || "");
      if (ret.hasOwnProperty(key)) {
        ret[key] = this.parse(ret[key], element);
      }
    });

    return ret;
  }

  // Returns a Route. Exists primary for ease of type-checking.
  route<D>(cb: (p: P, deps: D) => void): Route<P, D> {
    return (l: LocationLite, deps: D) => {
      let params = this.test(l);
      if (params) {
        cb(params, deps);
      }
      return params;
    };
  }
}

/*
  A Route defines a connection between a path and a callback function. Takes
  the form of a funciton that extracts params from location and takes some
  addtion dependencies. Returns true if successful.
*/
type Route<P, D> = {
  (l: LocationLite, deps: D): P|null;
}

/*
  Helper function for stripping out leading and trailing #!/ characters in
  hash. Returns 2-tuple of hash + querystring.
*/
function cleanHash(hash: string): [string, string] {
  let match = hash.match(/^[#!\/]*(.*?)[\/]*(\?.*)?$/);
  return match ? [match[1] || "", match[2] || ""] : ["", ""];
}

// Helper for navigating -- distiguish betwyeen hash paths and other
export namespace Nav {
  export var queryHashes: {[index: string]: string} = {};

  export function reset() {
    queryHashes = {};
  }

  export function go(path: string) {
    if (_.includes(path, "#")) {
      let [base, hash] = path.split("#");
      if (base === location.pathname) { // Same path, use router for fragment

        /*
          Handle really long querystrings by storing in memory. IE gets unhappy
          when we hit 2000 chars total for URL. We're only looking at hash,
          so go a bit under 2000 (hopefully domain name + pre-query string
          hash isn't too crazy)
        */
        if (hash.length > 1600) {
          let [start, query] = hash.split('?');
          let id = randomString();
          queryHashes[id] = query;
          hash = start + "?query=" + id;
        }

        location.hash = hash;
        return;
      }
    }

    // Else, update entire path
    location.href = path;
  }
}

// Service type for code relying on this
export type NavSvc = { Nav: typeof Nav };


/* Redux interfaces */

// Route action used to tell Redux store to update 'route' attribute
export interface RouteAction<S> {
  type: "ROUTE";
  route: S|NotFoundRoute;
}

// Route key reserved for routing
export interface RouteState<S> {
  route?: S|NotFoundRoute;
}

export interface NotFoundRoute {
  page: "NotFound"
}

export function routeReducer<R, S extends RouteState<R>>(
  state: S, action: RouteAction<R>
) {
  state = _.clone(state);
  state.route = action.route;
  return state;
}

/*
  Call to declare and initalize a list of routes. Generic type S should be
  specified as a union type to allow multiple route options.
*/
// Type of deps used for a Route (see below)
type RouteDeps = {
  dispatch: (a: RouteAction<NotFoundRoute>) => any;
  Svcs: NavSvc;
}

export function init<D extends RouteDeps>(
  routes: Route<any, D>[],
  getDeps: () => D,
  opts: {
    home?: () => string;  // Home redirect URL
  } = {})
{
  function onHashChange() {
    let { hash, pathname } = location;
    let deps = getDeps();

    /*
      Check if hash includes a queryString that points to another stored
      querystring. Replace with that querystring if appropriate.
    */
    hash = hash.replace(/\?query=([a-zA-Z0-9]+)/,
      (all: string, key: string) => {
        let stored = deps.Svcs.Nav.queryHashes[key];
        return stored ? ("?" + stored) : all;
      });

    let match = _.find(routes, (r) => r({ hash, pathname }, deps));
    if (! match) {
      // Check for empty or "home"
      if ((location.hash.match(/^[#!\/]*(.*?)[\/]*$/) || ["", ""])[1] === ""
          && opts.home) {
        deps.Svcs.Nav.go(opts.home());
      }

      else { // Not found
        deps.dispatch({
          type: "ROUTE",
          route: { page: "NotFound" }
        });
      }
    }
  }

  // Listen for changes
  window.addEventListener("hashchange", onHashChange, false);

  // Initial routing
  onHashChange();
}
