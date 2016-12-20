/*
  Returns a fake ApiSvc for testing -- all functions currently just
  return empty promises.
*/
import * as _ from "lodash";
import { default as Api, ApiSvc } from "../lib/api";
import { Deferred } from "../lib/util";
import * as Sinon from "sinon";

// Stubs an API call. Returns a deferred object you can resolve to trigger
// some promise-dependent action
export function stubApi(svc: ApiSvc, name: string) {
  return stubApiPlus(svc, name).dfd;
}

// Same as stubApi above, but also returns the Sinon stub
export function stubApiPlus(svc: ApiSvc, name: string) {
  let Api: any = svc.Api;
  let dfd = new Deferred();   // Passed to user to control when call resolves
  let cbDfd = new Deferred(); //
  let stub = Sinon.stub(Api, name, function() {
    if (cbDfd.state === "pending") cbDfd.resolve();
    return dfd.promise();
  });
  return { dfd, stub, promise: cbDfd.promise() };
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

  // Batch is a special case -- execute function immediately
  newApi.batch = function batch(fn: () => any) {
    return new Promise((resolve) => resolve(fn()));
  }

  return { Api: newApi };
}

export default apiSvcFactory;
