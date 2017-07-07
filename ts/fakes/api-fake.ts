/*
  Returns a fake ApiSvc for testing -- all functions currently just
  return empty promises.
*/
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
  let stub = Sinon.stub(Api, name).callsFake(function() {
    if (cbDfd.state === "pending") cbDfd.resolve();
    return dfd.promise();
  });
  return { dfd, stub, promise: cbDfd.promise() };
}

export function stubApiRet(svc: ApiSvc, name: string, val?: any) {
  let Api: any = svc.Api;
  let stub = Sinon.stub(Api, name).callsFake(function(...args: any[]) {
    if (typeof val === "function") {
      return Promise.resolve(val(...args));
    }
    return Promise.resolve(val);
  });
  return stub;
}

// Factory function that spits out a fake API service for testing
export function apiSvcFactory(): ApiSvc {
  // Iterate over each function and (with some exceptions) replace with one
  // that returns a generic promise
  let newApi: any = { ...Api };
  for (let key in Api) {
    let k = key as keyof typeof Api;
    let v = Api[k];
    if (k && typeof v === "function" && v !== Api.batch) {
      newApi[k] = function() {
        return new Promise(() => {});
      }
    }
  };

  // Batch is a special case -- execute function immediately
  newApi.batch = function batch(fn: () => any) {
    return new Promise((resolve) => resolve(fn()));
  }

  // Init + reset = synchronous
  newApi.init = function () {};
  newApi.reset = function () {};

  return { Api: newApi };
}

export default apiSvcFactory;
