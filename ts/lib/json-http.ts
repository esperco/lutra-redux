// Utilities for calling the Esper API

import * as ApiT from "./apiT";
import * as SHA1 from "crypto-js/sha1";
import * as $ from "jquery";
import * as _ from "lodash";
import * as Log from "./log";
import * as Util from "./util";
import * as Errors from "./errors";

/*
  By default, JQueryPromiseType does not type errors. Let's extend the
  interface to include proper typing for error messages that we can throw
  around in A+ thenable promises
*/
export class AjaxError extends Error {
  code: number
  respBody: string;
  method: string;
  url: string;
  reqBody: any;

  // Additional info populated if error is instance of ApiT.ClientError
  details?: Errors.ErrorDetails;

  /*
    Flag to signal that this error has been handled and should not be logged
    to Sentry or thrown as an exception.
  */
  handled?: boolean;

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

    try {
      var parsedJson: ApiT.ClientError = JSON.parse(this.respBody);
      if (isClientError(parsedJson)) {
        this.name = parsedJson.error_message;
        this.details = Errors.errorDetail(parsedJson.error_details);
      }
    } catch (err) { /* Ignore - not JSON response */ }
  }
}

// Typeguard to check nature of error details
function isClientError(e: any): e is ApiT.ClientError {
  let typedError = e as ApiT.ClientError;
  return !_.isUndefined(typedError) &&
    !!_.isNumber(typedError.http_status_code) &&
    !!_.isString(typedError.error_message);
}

type DoneCallback<T> = JQueryPromiseCallback<T>;
type ErrorCallback = JQueryPromiseCallback<AjaxError>;

// JQueryPromise with proper failure typing
export interface Promise<T> extends JQueryPromise<T> {
  done(...cbs: Array<DoneCallback<T>|DoneCallback<T>[]>): Promise<T>;
  fail(...cbs: Array<ErrorCallback|ErrorCallback[]>): Promise<T>;

  /*
    Handles case where failFilter doesn't change error type, return
    value for .then is therefore another JsonHttp.Promise
  */
  then<U>(doneFilter: (value: T) => U|Promise<U>,
          failFilter?: (err: AjaxError) => AjaxError|void|Promise<U>,
          progressFilter?: (...progression: any[]) => any): Promise<U>;

  /*
    Handles case where failFilter does change error type. We stop making
    inferences about error typing at this point and just return default
    JQueryPromise.
  */
  then<U>(doneFilter: (value: T) => U|Promise<U>,
          failFilter?: (err: AjaxError) => any,
          progressFilter?: (...progression: any[]) => any): JQueryPromise<T>;

  /*
    Handles case where failFilter doesn't change error type, but voids
    return value. So return value for .then is JsonHttp.Promise<void>
  */
  then(doneFilter: (value: T) => void,
       failFilter?: (err: AjaxError) => AjaxError|void|Promise<void>,
       progressFilter?: (...progression: any[]) => any): Promise<void>;
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
  export var errorHandler = function(err: AjaxError) {};

  export interface Config {
    esperVersion?: string;

    // Function that returns true if handled
    errorHandler?: (err: AjaxError) => void;
  }

  export function init(props: Config = {}) {
    if (_.isString(props.esperVersion)) {
      esperVersion = props.esperVersion;
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

  function setHttpHeaders(path: string) {
    return function(jqXHR: JQueryXHR) {
      if (apiSecret) {
        let typedOffset = _.isNumber(offset) ? offset : 0;
        let unixTime = Math.round(Date.now()/1000 + typedOffset).toString();
        let signature = sign(unixTime, path, apiSecret);
        jqXHR.setRequestHeader("Esper-Timestamp", unixTime);
        jqXHR.setRequestHeader("Esper-Path", path);
        jqXHR.setRequestHeader("Esper-Signature", signature);

        if (esperVersion) {
          jqXHR.setRequestHeader("Esper-Version", esperVersion);
        }
      }
    }
  }

  function truncateText(s: any,
                        maxLength: number): any {
    if (_.isString(s) && s.length > maxLength)
      return s.slice(0, maxLength) + " ...";
    else
      return s;
  }

  // Error logging helper
  function logError(err: AjaxError) {

    /*
      Log error asynchronously to give promises further down an opportunity
      to resolve. Use setTimeout rather than requestAnimationFrame because
      (as of jQuery 3), `then` callbacks are called asynchronously, so we 
      can't guarantee thens are executed synchronously before other promises 
      have a chance to handle.
    */
    setTimeout(() => {
      if (err.handled) {
        Log.i("Handled error", err);
      } else if (err.code === 0) {
        Log.w("Ignored error", err)
      } else {
        // Fire default error handler + log
        errorHandler(err);
        let errorMsg = err.details ? err.details.tag : err.respBody;
        Log.e(`${err.code} ${errorMsg}`, err);
      }
    }, 2000);
  }

  // Response logging helper
  function logResponse({id, method, path, respBody, latency} : {
    id: string;
    method: string;
    path: string;
    respBody: string;
    latency: number;
  }) {
    var truncatedBody = truncateText(respBody, 1000);
    Log.d("API response " + id
          + " " + method
          + " " + path
          + " [" + latency + "s]",
          truncatedBody);
  }

  
  /** Executes an http request using our standard authentication,
   *  logging and error handling. Can have a custom (ie non-JSON)
   *  content type.
   *
   *  contentType can be "" if the request should not have a
   *  Content-Type header at all. (This is translated to jQuery as
   *  `false', which it supports since 1.5.)
   *
   *  processData controls whether the body is converted to a query
   *  string. It is true by default.
   */
  export function httpRequest(method: string,
                              path: string,
                              body: string,
                              dataType: string,
                              contentType: string,
                              processData = true): Promise<any> {
    var id = Util.randomString();
    var contentTypeJQ : any = contentType == "" ? false : contentType;

    /*
      We return a Deferred object.
      Use .done(function(result){...}) to access the result.
      (see jQuery documentation)
    */
    var request = {
      url: path,
      type: method,
      data: body,
      contentType: contentTypeJQ,
      beforeSend: setHttpHeaders(path),
      dataType: dataType // type of the data expected from the server
    };
    Log.d("API request " + id + " " + method + " " + path, request);

    var startTime = Date.now();
    var ret: Promise<any> = $.ajax(request).then(
      (success) => success,
      (xhr: JQueryXHR) => {
        throw new AjaxError({
          code: xhr.status,
          respBody: xhr.responseText,
          method: method,
          url: path,
          reqBody: body
        });
      }
    );

    ret.done(function(respBody) {
      var latency = (Date.now() - startTime) / 1000;
      logResponse({id, method, path, respBody, latency});
    });

    ret.fail(logError);

    return ret;
  }

  /** Executes an HTTP request using our standard authentication and
   *  error handling and a JSON content type. Handles batching.
   */
  function jsonHttp(method: ApiT.HttpMethod,
                    path: string,
                    body?: any) {
    // Batch, don't fire call.
    if (insideBatch) {
      let request: ApiT.HttpRequest<any> = {
        request_method: method,
        request_uri: path
      };
      if (body) {
        request.request_body = body;
      }
      let index = batchQueue.length;
      batchQueue.push(request);
      return batchDfd.promise()
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
            logError(error);
            throw error;
          }
        });
    }

    // Normal, non-batch
    var contentType = body ? "application/json; charset=UTF-8" : "";
    return httpRequest(
      method,
      path,
      JSON.stringify(body),
      "json",
      contentType);
  }

  // Track whether we're inside a batch sequence.
  var insideBatch = false;

  // Queue up batched requests
  var batchQueue: ApiT.HttpRequest<any>[] = [];
  var batchDfd: JQueryDeferred<ApiT.BatchHttpResponses<any>>;

  export function batch<T>(fn: () => JQueryPromise<T>|T,
                           batchPath: string): Promise<T> {
    var topLevel = !insideBatch;
    if (topLevel) {
      insideBatch = true;
      batchDfd = $.Deferred();
    }

    var ret = fn();
    try {
      if (topLevel) {
        insideBatch = false;
        jsonHttp("POST", batchPath, {
          requests: batchQueue
        }).then(
          (r) => batchDfd.resolve(r),
          (e) => batchDfd.reject(e)
        );
      }
      return batchDfd.then(() => ret);
    } catch(e) {
      return batchDfd.reject(e).then(() => ret);
    } finally {
      if (topLevel) {
        insideBatch = false;
        batchQueue = [];
      }
    }
  }

  export function get(path: string) {
    return jsonHttp("GET", path, null);
  }

  export function post(path: string,
                       body?: any) {
    return jsonHttp("POST", path, body);
  }

  export function put(path: string,
                      body?: any) {
    return jsonHttp("PUT", path, body);
  }

  export function delete_(path: string) {
    return jsonHttp("DELETE", path, null);
  }
}

export default JsonHttp;