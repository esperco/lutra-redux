// Utilities for calling the Esper API

import * as ApiT from "./apiT";
import * as SHA1 from "crypto-js/sha1";
import * as _ from "lodash";
import * as Log from "./log";
import * as Util from "./util";
import * as Errors from "./errors";

export class AjaxError extends Error {
  code: number
  respBody: string;
  method: string;
  url: string;
  reqBody: any;

  // Additional info populated if error is instance of ApiT.ClientError
  details?: Errors.ErrorDetails;

  /*
    instanceof AjaxError may not work. See
    https://github.com/Microsoft/TypeScript/wiki/Breaking-Changes
      #extending-built-ins-like-error-array-and-map-may-no-longer-work

    So let's check for this attribute instead.
  */
  _isAjaxError: boolean;

  constructor({method, url, reqBody, code, respBody} : {
    method: string;
    url: string;
    reqBody: any;
    code: number;
    respBody: string;
  }) {
    super("error");
    this.method = method;
    this.url = url;
    this.reqBody = reqBody;
    this.code = code;
    this.respBody = respBody;
    this._isAjaxError = true;

    try {
      var parsedJson: ApiT.ClientError = JSON.parse(this.respBody);
      if (isClientError(parsedJson)) {
        this.name = parsedJson.error_message;
        this.details = Errors.errorDetail(parsedJson.error_details);
      }
    } catch (err) { /* Ignore - not JSON response */ }
  }
}

export function isAjaxError(e: Error): e is AjaxError {
  return e && !!(e as any)._isAjaxError;
}


/*
  Normally the whole point of promises is to avoid callbacks, but JsonHttp
  functions provide a callback as a quick way to avoid triggering the default
  error handler(s).
*/
type ErrCb<T> = (err: AjaxError) => T;

// Typeguard to check nature of error details
function isClientError(e: any): e is ApiT.ClientError {
  let typedError = e as ApiT.ClientError;
  return !_.isUndefined(typedError) &&
    !!_.isNumber(typedError.http_status_code) &&
    !!_.isString(typedError.error_message);
}

namespace JsonHttp {
  /* Singleton values that need to be set by init function below */

  // The version needs to be set by the application, e.g. stoat-1.2.3
  export var esperVersion: string|undefined;

  // An API secret used to sign
  export var apiSecret: string|undefined;

  /*
    Offset between browser time and server time in seconds. Use to correct for
    user times being out of sync with us.
  */
  export var offset: number|undefined;

  // Override in init
  export var startHandler = function(id: string, modData: boolean) {};
  export var successHandler = function(id: string) {};
  export var errorHandler = function(id: string, err: Error) {};

  export interface Config {
    esperVersion?: string;

    // Global handler for when JSON call starts
    startHandler?: (id: string, modData: boolean) => void;

    // Global success handler -- gets called if no error or if error is handled
    successHandler?: (id: string) => void;

    // Global error handler -- gets called if error is not handled
    errorHandler?: (id: string, err: Error) => void;
  }

  export function init(props: Config = {}) {
    if (_.isString(props.esperVersion)) {
      esperVersion = props.esperVersion;
    }
    if (_.isFunction(props.startHandler)) {
      startHandler = props.startHandler;
    }
    if (_.isFunction(props.successHandler)) {
      successHandler = props.successHandler;
    }
    if (_.isFunction(props.errorHandler)) {
      errorHandler = props.errorHandler;
    }
  }

  export function setSecret(secret: string) {
    apiSecret = secret;
  }

  export function setOffset(newOffset: number) {
    offset = newOffset;
  }

  // Sign request with time and secret
  export function sign(unixTime: string,
                       path: string,
                       apiSecret: string): string {
    return SHA1(
      unixTime
        + ","
        + path
        + ","
        + apiSecret
    ).toString();
  }

  function getHeaders(path: string, contentType?: string) {
    let headers = new Headers();
    if (apiSecret) {
      let typedOffset = _.isNumber(offset) ? offset : 0;
      let unixTime = Math.round(Date.now()/1000 + typedOffset).toString();
      let signature = sign(unixTime, path, apiSecret);
      headers.append("Esper-Timestamp", unixTime);
      headers.append("Esper-Path", path);
      headers.append("Esper-Signature", signature);
      if (esperVersion) {
        headers.append("Esper-Version", esperVersion);
      }
    }
    if (contentType) {
      headers.append("content-type", contentType);
    }
    return headers;
  }

  function truncateText(s: any,
                        maxLength: number): any {
    if (_.isString(s) && s.length > maxLength)
      return s.slice(0, maxLength) + " ...";
    else
      return s;
  }

  /*
    Add success and error handlers to a promise -- branches off main
    promise so these are mostly just callbacks, logging
  */
  function withCallbacks<T>(id: string, promise: Promise<T>) {
    promise.then(
      (respBody) => successHandler(id),
      (err: Error) => {
        if (isAjaxError(err) && err.code === 0) {
          Log.w(`Ignored error`, err)
        } else if (isAjaxError(err)) {
          // Fire default error handler + log
          let errorMsg = err.details ? err.details.tag : err.respBody;
          Log.e(`${err.code} ${errorMsg}`, err);
        } else {
          Log.e(`Unknown error`, err);
        }
        errorHandler(id, err);
      }
    );
    return promise;
  }

  // Success logging helper
  function logResponse({id, method, path, respBody, startTime} : {
    id: string;
    method: string;
    path: string;
    respBody: string;
    startTime: number;
  }) {
    let latency = (Date.now() - startTime) / 1000;
    let resp: any = respBody;
    try {
      resp = JSON.parse(respBody)
    } catch (err) {
      resp = truncateText(respBody, 1000);
    }
    Log.d("API response " + id
          + " " + method
          + " " + path
          + " [" + latency + "s]",
          resp);
  }


  /** Executes an http request using our standard authentication,
   *  logging and error handling. Can have a custom (ie non-JSON)
   *  content type.
   *
   *  contentType can be "" if the request should not have a
   *  Content-Type header at all. (This is translated to jQuery as
   *  `false', which it supports since 1.5.)
   */
  function httpRequest({id, method, path, body, contentType} : {
    id: string;
    method: string;
    path: string;
    body?: string;
    contentType: string;
  }): Promise<{ resp: Response; respBody: string; }> {
    Log.d("API request " + id + " " + method + " " + path, body);

    let headers = getHeaders(path, contentType);
    let startTime = Date.now();
    return fetch(path, Util.compactObject({ method, headers, body }))
      .then((resp) => resp.text().then((respBody) => ({ resp, respBody })))
      .then(({resp, respBody}) => {
        logResponse({ id, method, path, respBody, startTime });
        if (! resp.ok) {
          throw new AjaxError({
            code: resp.status,
            respBody,
            method: method,
            url: path,
            reqBody: body
          });
        };
        return {resp, respBody};
      });
  }

  /** Executes an HTTP request using our standard authentication and
   *  error handling and a JSON content type. Handles batching.
   */
  function jsonHttp(method: ApiT.HttpMethod,
                    path: string,
                    modData = false,
                    body?: any,
                    errCb?: ErrCb<any>) {
    // Assign random ID to this request
    let id = Util.randomString();
    startHandler(id, modData);

    // Batch, don't fire call.
    if (!!batchPromise) {
      let request: ApiT.HttpRequest<any> = {
        request_method: method,
        request_uri: path
      };
      if (body) {
        request.request_body = body;
      }
      let index = batchQueue.length;
      batchQueue.push({ modData, request });

      let p = batchPromise
        .then((success) => {
          if (! success) {
            throw new AjaxError({
              code: 404,
              method: method,
              url: path,
              reqBody: body,
              respBody: ""
            });
          }
          let response = success.responses[index];
          let status = response && response.response_status;
          if (status && ((status >= 200 && status < 300) || status === 304)) {
            return response.response_body;
          } else {
            let error = new AjaxError({
              code: status,
              method: method,
              url: path,
              reqBody: body,
              respBody: JSON.stringify(response.response_body)
            });
            if (errCb) { return errCb(error); }
            throw error;
          }
        });
      return withCallbacks(id, p);
    }

    // Normal, non-batch.
    let contentType = body ? "application/json; charset=UTF-8" : "";
    let request = httpRequest({
      id, method, path,
      body: body ? JSON.stringify(body) : undefined,
      contentType
    }).then(
      ({ respBody }) => JSON.parse(respBody),
      (err) => {
        if (errCb && isAjaxError(err)) {
          return errCb(err);
        }
        throw err;
      }
    );
    return withCallbacks(id, request);
  }

  // Queue up batched requests
  interface BatchRequest {
    modData: boolean; // Does this call modify data?
    request: ApiT.HttpRequest<any>;
  }
  var batchQueue: BatchRequest[] = [];

  // Initialize this if we're inside a batch sequence
  var batchPromise: Promise<ApiT.BatchHttpResponses<any>>|null = null;

  export function batch<T>(fn: () => Promise<T>|T,
                           batchPath: string): Promise<T> {
    var topLevel = false;
    var resolveFn: (value?: {}|Thenable<{}>|undefined) => void = () => null;
    var rejectFn: (error?: Error) => void = () => null;
    if (! batchPromise) {
      topLevel = true;
      batchPromise = new Promise(function(resolve, reject) {
        resolveFn = resolve;
        rejectFn = reject;
      });
    }

    let ret = fn();
    let p = batchPromise.then(() => ret);
    try {
      if (topLevel) {
        batchPromise = null;
        let modData = !!_.find(batchQueue, (b) => b.modData);
        jsonHttp("POST", batchPath, modData, {
          requests: _.map(batchQueue, (b) => b.request)
        }).then(resolveFn, rejectFn);
      }
    } catch(e) {
      rejectFn(e);
    } finally {
      if (topLevel) {
        batchPromise = null;
        batchQueue = [];
      }
    }
    return p;
  }

  export function get(path: string, errCb?: ErrCb<any>) {
    return jsonHttp("GET", path, false, null, errCb);
  }

  export function post(path: string,
                       body?: any,
                       errCb?: ErrCb<any>) {
    return jsonHttp("POST", path, true, body, errCb);
  }

  // Like post, but used to signal that this post doesn't modify data on server
  export function postGet(path: string,
                          body?: any,
                          errCb?: ErrCb<any>) {
    return jsonHttp("POST", path, false, body, errCb);
  }

  export function put(path: string,
                      body?: any,
                      errCb?: ErrCb<any>) {
    return jsonHttp("PUT", path, true, body, errCb);
  }

  export function delete_(path: string, errCb?: ErrCb<any>) {
    return jsonHttp("DELETE", path, true, null, errCb);
  }
}

export default JsonHttp;