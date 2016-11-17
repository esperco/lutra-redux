/*
  Routing + Path helpers
*/
import * as _ from 'lodash';
import * as page from 'page';
import * as Log from './log';
import { randomString } from "./util";

type StrMap = {[index: string]: string};

/*
  A Route defines a connection between a pageJs pattern and a callback
  function that (optionally) returns a state change that can be passed to
  our Redux dispatcher.
*/
type Route<S> = [string, (ctx: PageJS.Context) => S|null];

// A Path instance contains functions for creating a route
export class Path<P extends StrMap, Q extends StrMap> {
  constructor(public opts: {
    // Prefix for our path -- added to our path function when calling
    // href function -- can be used for base paths with a hash
    base: string;

    // Object representing available params
    params: P;

    // Object representing querystring options -- we can't ensure this
    // type when coming in via URL input, so should clean input
    query: Q;

    // Function to convert params to path
    toStr: (p: P) => string;
  }) { }

  // Public path, for links and navigation
  href(p: P, q?: Q) {
    let base = this.opts.base;
    if (base[base.length - 1] === "/") { base = base.slice(0, -1); }

    let subPath = this.opts.toStr(p);
    if (subPath[0] !== "/") { subPath = "/" + subPath; }

    return base + subPath + (q ? this.param(q) : "");
  }

  // Format query string parameters
  param(q: Q) {
    if (_.isEmpty(q)) return "";
    return "?" + _(q)
      .map((v: string, k: string) =>
        encodeURIComponent(k) + "=" + encodeURIComponent(v)
      )
      .join("&");
  }

  // Generates the pattern used for routing purposes
  routePattern() {
    let subPath = this.opts.toStr(keymap(this.opts.params));
    if (subPath[0] !== "/") { subPath = "/" + subPath; }
    return subPath;
  }

  /*
    Typechecks a callback hooked up to this path. Returns a 2-tuple of a
    route pattern and page.js callback you can hookup to the Route via the
    init function.
  */
  route<S>(cb: (params: P, query: Q) => S|null): Route<S> {
    return [this.routePattern(), (ctx) => {
      let query: any = {};
      let params = deparam(ctx.querystring);

      // Nav.go will store very long hashes in memory to avoid 2000-char
      // URL limit
      let hashKey = params['hash'];
      if (hashKey && Nav.queryHashes[hashKey]) {
        params = deparam(Nav.queryHashes[hashKey]);
      }

      // Filter out only params that appear in query. Assign empty strings
      // if not available to avoid type errors
      _.each(this.opts.query, (v, k) => {
        if (k) {
          query[k] = params[k] || "";
        }
      });

      return cb(ctx.params, query);
    }];
  }
}

/*
  Takes an object representing keys and mutates params so each param
  is in form expected by routers

    keymap({ a: "", b: "" }) => { a: ":a", b: ":b" }
*/
function keymap<P extends Object>(p: P): P {
  _.each(p, (v, k) => {
    let params: any = p;
    if (k) {
      params[k] = ":" + k;
    }
  });
  return p;
}

/*
  Simple, sort of dumb function for converting query params to object.
  Doesn't do anything fancy with arrays or stuff.
*/
export function deparam(queryStr: string) {
  if (queryStr[0] === "?") queryStr.slice(1);
  let queryParts = queryStr.split("&");
  let ret: StrMap = {};
  _.each(queryParts, (part) => {
    let [prefix, element] = part.split("=");
    element = element || ""; // In case element is undefined
    ret[decodeURIComponent(prefix)] = decodeURIComponent(element);
  });
  return ret;
}

// Helper for navigating -- distiguish betwyeen hash paths and other
export namespace Nav {
  export var queryHashes: {[index: string]: string} = {};

  export function go(path: string) {
    if (_.includes(path, "#")) {
      let base = path.split("#")[0];
      if (base === location.pathname) { // Same path, use router for fragment
        // Handle really long querystrings by storing in memroy
        if (path.length > 2000) {
          let [start, query] = path.split('?');
          let id = randomString();
          queryHashes[id] = query;
          path = start + "?hash=" + id;
        }
        page(path);
        return;
      }
    }

    // Else, update entire path
    location.href = path;
  }
}

// Service type for code relying on this
export type NavSvc = { Nav: typeof Nav };


/* Special Hash-paths for home and not-found pages to handle quirks */

// Home page -- distinguish between "#" (does nothing) and "#!" (home)
var initLoad = true;
export function routeHome(fn: PageJS.Callback) {
  page("", function(ctx, next) {
    if (initLoad || ctx.pathname.indexOf("!") >= 0) {
      initLoad = false;
      next();
    }
  }, fn);
}

export function routeNotFound(...callbacks: PageJS.Callback[]) {
  page('*', function(ctx, next) {
    // To deal with weird issue where hrefs get too many slashes prepended.
    if (ctx.path.slice(0,2) === "//") {
      Nav.go(ctx.path.slice(1));
    } else {
      Log.e("Route not found", ctx);
      next();
    }
  }, ...callbacks);
}


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
  page: "NOT_FOUND"
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
export function init<S>(routes: Route<S>[], opts: {
  dispatch: (action: RouteAction<S>) => any;
  home: () => string; // Home redirect
}) {
  // Add default, home page callback
  routeHome(function() {
    Nav.go(opts.home());
  });

  // Add specified routse
  _.each(routes, ([path, cb]) => {
    page(path, function(ctx) {
      let stateOrNull = cb(ctx);
      if (stateOrNull) {
        opts.dispatch({
          type: "ROUTE",
          route: stateOrNull
        })
      }
    });
  });

  // Add not found callback
  routeNotFound(function() {
    opts.dispatch({
      type: "ROUTE",
      route: { page: "NOT_FOUND" }
    });
  });

  page.base(location.pathname);
  page({
    click: false,
    hashbang: true
  });
}
