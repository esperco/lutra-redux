/*
  Support for simple, type-checked hashbang routing
*/
import * as _ from 'lodash';
import * as Log from './log';
import { AnalyticsSvc } from "./analytics";
import { randomString } from "./util";

// A ParamType is a way of type-checking URL values
export interface ParamType<T> {
  clean: (val?: string) => T;
  toStr: (val: T) => string;
}

export const StringParam: ParamType<string> = {
  clean(val?: string) {
    return val || "";
  },
  toStr(val: string) {
    return encodeURIComponent(val);
  }
};

export const NumberParam: ParamType<number> = {
  clean(val?: string) {
    return parseFloat(val || "0");
  },
  toStr(val: number) {
    return encodeURIComponent(val.toString());
  }
};

export const BooleanParam: ParamType<boolean> = {
  clean(val?: string) {
    return !!val && !!parseInt(val);
  },

  toStr(val: boolean) {
    return val ? "1" : "0";
  }
}

// See arraySeparator below
const DefaultArraySeparator = ",";

function makeArrayParam<T>(base: ParamType<T>): ParamType<T[]> {
  return {
    clean(val?: string) {
      if (val) {
        return _.map(val.split(DefaultArraySeparator),
          (v) => base.clean(v)
        );
      }
      return [];
    },

    toStr(val: T[]) {
      return _.map(val, (v) => base.toStr(v)).join(DefaultArraySeparator);
    }
  }
}

export const StringArrayParam = makeArrayParam(StringParam);
export const NumberArrayParam = makeArrayParam(NumberParam);
export const BooleanArrayParam = makeArrayParam(BooleanParam);

type ParamMap = {[index: string]: any;}
type ParamTypeMap<T> = {
  [P in keyof T]: ParamType<T[P]>;
}

// Subset of window.location needed for mapping location to path
type LocationLite = {
  pathname: string;
  hash: string;
}

// A Path instance contains functions for creating a hash route
export class Path<P extends ParamMap, O extends ParamMap> {
  base: string;
  params: ParamTypeMap<P>;
  optParams: ParamTypeMap<O>;
  hash: string[];

  constructor(opts: {
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
    params?: ParamTypeMap<P>;

    /*
      Optional params
    */
    optParams?: ParamTypeMap<O>;

    /*
      A list of hash components -- prefix with a `:` to denote as an argument.
      The argument will be checked against the `params` argument.
    */
    hash?: string[];
  }) {
    this.base = opts.base;
    this.hash = opts.hash || [];

    /*
      Using any because while {} isn't applicable to any generic
      ParamTypeMap<P>, if opts.params isn't specified, then P must
      be {} (and TypeScript isn't smart enoguh to pick this up yet)
    */
    this.params = opts.params || {} as any;
    this.optParams = opts.optParams || {} as any;
  }

  // Public path, for links and navigation
  href(p: P & Partial<O>) {
    let base = this.base;
    if (base[base.length - 1] === "/") { base = base.slice(0, -1); }

    // So we can delete stuff
    p = _.clone(p);

    let subPath = "/" + _.map(this.hash, (h) => {
      if (h[0] === ":") {
        h = h.slice(1);
        let val = p[h];
        delete p[h];

        let paramType = this.params[h];
        if (! paramType) {
          throw new Error("Unspecified param " + h);
        }
        return paramType.toStr(val);
      } else {
        return h;
      }
    }).join("/");

    return base + "#!" + subPath + this.querystring(p);
  }

  // Format query string parameters
  querystring(p: P & Partial<O>) {
    if (_.isEmpty(p)) return "";
    return "?" + _(p)
      .map((v: string, k: string) => {
        let paramType = this.params[k] || this.optParams[k];
        if (! paramType) {
          return ""; // Junk param, ignore
        }
        return encodeURIComponent(k) + "=" + paramType.toStr(v)
      })
      .filter((v) => !!v)
      .join("&");
  }

  // Test if a given path string matches this one -- returns params if so,
  // null otherwise
  test(l: LocationLite): (P & Partial<O>)|null {
    if (l.pathname !== this.base &&
        l.pathname !== "/" + this.base) {
      return null;
    }

    /*
      We look at querystring AFTER hash (not a real querystring, just a way
      of using querystring params in hash)
    */
    let [hash, queryStr] = cleanHash(l.hash);

    // Pre-querystring portion of hash must match exactly (no optional args)
    let hashParts = hash.split('/');
    if (hashParts.length !== (this.hash).length) {
      return null;
    }

    // Using any because https://github.com/Microsoft/TypeScript/issues/12731
    let ret: Partial<P> & Partial<O> = {} as any;

    // Clone params so we can use as default (and replace as appropriate)
    let required = _.clone(this.params);
    let optional = _.clone(this.optParams);

    // Process hash parts first
    let zipped = _.zip(hashParts, this.hash);
    for (let i in zipped) {
      let [actual, expected] = zipped[i];
      if (expected[0] === ":") { // Expect param argument
        let key = expected.slice(1);
        if (! required.hasOwnProperty(key)) {
          Log.e("Unexpected param - " + key);
          return null;
        }
        ret[key] = required[key].clean(actual);
        delete required[key];
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
      if (required.hasOwnProperty(key)) {
        ret[key] = required[key].clean(element);
        delete required[key];
      } else if (optional.hasOwnProperty(key)) {
        ret[key] = optional[key].clean(element);
        delete optional[key];
      }
    });

    // Missing required element -> no match
    if (! _.isEmpty(required)) {
      return null;
    }

    return ret as P & Partial<O>;
  }

  // Returns a Route. Exists primary for ease of type-checking.
  route<D>(cb: (p: P & Partial<O>, deps: D) => void): Route<P, O, D> {
    return _.extend((l: LocationLite, deps: D) => {
      let params = this.test(l);
      if (params) {
        cb(params, deps);
      }
      return params;
    }, { path: this });
  }
}

/*
  A Route defines a connection between a path and a callback function. Takes
  the form of a funciton that extracts params from location and takes some
  addtion dependencies. Returns true if successful.
*/
type Route<P extends ParamMap, O extends ParamMap, D> = {
  (l: LocationLite, deps: D): (P & Partial<O>)|null;

  // Reference back to original path
  path: Path<P, O>;
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
  Svcs: NavSvc & AnalyticsSvc;
}

export function init<D extends RouteDeps>(
  routes: Route<any, any, D>[],
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

    let params: any;
    let match = _.find(routes, (r) => {
      params = r({ hash, pathname }, deps);
      return !!params;
    });

    if (match) {
      // Analytics
      let path = match.path;
      let name = path.base + "#!/" + path.hash.join("/");
      deps.Svcs.Analytics.page(name, params);
    }

    else {
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
