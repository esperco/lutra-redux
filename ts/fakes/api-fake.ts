/*
  Returns a fake ApiSvc for testing -- all functions currently just
  return empty promises.
*/
import * as _ from "lodash";
import { default as Api, ApiSvc } from "../lib/api";
import { Deferred } from "../lib/util";

// Stubs an API call. Returns a deferred object you can resolve to trigger
// some promise-dependent action
export function stubApi(svc: ApiSvc, name: string) {
  let Api: any = svc.Api;
  let dfd = new Deferred();
  Api[name] = function() {
    return dfd.promise();
  }
  return dfd;
}

// Factory function that spits out a fake API service for testing
export function apiSvcFactory(): ApiSvc {
  // Iterate over each function and (with some exceptions) replace with one
  // that returns a generic promise
  let newApi: any = _.clone(Api);
  _.each(Api, (v, k) => {
    if (k && _.isFunction(v) && v !== Api.batch) {
      newApi[k] = function() {
        return new Promise(() => {});
      }
    }
  });

  // Batch is a special case
  newApi.batch = function batch(fn: () => any) {
    fn();
    return new Promise(() => {});
  }

  return { Api: newApi };
}

export default apiSvcFactory;
