/*
  An analytics service that integrates with Segment
*/
import * as _ from 'lodash';
import * as moment from 'moment';
import { LoginResponse } from './apiT';

/*
  Union types for what we can track -- must either be a string literal
  or a two-tuple variant
*/
export type Trackable = ""; // TBD
export type Pageable =
  ["GroupEvents", { groupId: string }]|   // groups#!/group-events
  "GroupSetup"                            // groups#!/setup

export namespace Analytics {
  // Track a separate event
  export function track(event: Trackable) {
    let name: string;
    let props: any = {};
    if (_.isArray(event)) {
      name = event[0];
      props = _.extend(props, event[1]);
    } else {
      name = event;
    }
    analytics.ready(function() {
      analytics.page(name, props);
    });
  }

  // Track a page
  export function page(event: Pageable) {
    let name: string;
    let props: any = { url: location.href }; // So hash is included
    if (_.isArray(event)) {
      name = event[0];
      props = _.extend(props, event[1]);
    } else {
      name = event;
    }
    analytics.ready(function() {
      analytics.page(name, props);
    });
  }

  // Identify user
  export function identify(loginInfo: LoginResponse) {
    analytics.ready(function() {
      analytics.user().id() !== loginInfo.uid;
      if (loginInfo.is_sandbox_user) {
        analytics.identify({
          sandbox: true
        });
      } else {
        // Alias user if new account
        if (loginInfo.account_created &&
            moment().diff(moment(loginInfo.account_created)) < 300000)
        {
          analytics.alias(loginInfo.uid);
        }

        // Identify user regardless of previous login status
        analytics.identify(loginInfo.uid, {
          email: loginInfo.email,
          platform: loginInfo.platform,
          sandbox: false
        });
      }
    });
  }

  // Clear tracking IDs
  export function reset() {
    var user = analytics.user();
    if (user) {
      user.logout();
      user.reset();
    }
  }


  /* Helper functions */

  // Helper to flatten objects into a single level, which works better with
  // Mixpanel than nested objects
  interface IFlatProps {
    [index: string]: number|string|boolean|Date|Array<IFlatProps>;
  };
  function flatten(obj: {[index: string]: any},
                   prefix?: string, ret?: IFlatProps): IFlatProps {
    ret = ret || {};
    prefix = prefix ? prefix + "." : "";
    for (let name in obj) {
      if (obj.hasOwnProperty(name)) {
        if (typeof obj[name] === "object" && !(obj[name] instanceof Array)) {
          ret = flatten(obj[name], prefix + name, ret);
        } else {
          ret[prefix + name] = obj[name];
        }
      }
    }
    return ret;
  }
}

export default Analytics;
export type AnalyticsSvc = { Analytics: typeof Analytics };

// Stub in case Segment doesn't load (e.g. ad-blocker)
if (! (<any> window).analytics) {
  (<any> window).analytics = {
    ready: function() {},
    user: function() {},
    track: function() {},
    page: function() {}
  }
}