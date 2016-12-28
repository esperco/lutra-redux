/*
  Logging helpers
*/
import * as Raven from 'raven-js';
import { init as initRaven } from './raven';
var ravenClient: (typeof Raven)|undefined;

/*
  Change this tag to distinguish between different scripts
  logging to the same console.
*/
var tag = "Esper";

/*
  Change this to enable tracing when possible
*/
var trace = false;

// Shims
if (! self.console) {
  (<any> self).console = <any>{ log: function () {} };
}
console.trace  = console.trace || console.log;
console.info   = console.info || console.log;
console.warn   = console.warn || console.log;
console.error  = console.error || console.log;

// Log level - change to set min threshhold for logging
// Level.BOOM -> means don't log (exceptions only)
export enum Level { DEBUG = 1, INFO, WARN, ERROR, BOOM };
export var level: Level = Level.DEBUG; // Default

// Can change level here
export function init({ logLevel, logTag, logTrace, ravenUrl } : {
  logLevel?: Level;
  logTag?: string;
  logTrace?: boolean;
  ravenUrl?: string;
}) {
  level = typeof logLevel === "number" ? logLevel : level;
  tag = typeof logTag === "string" ? logTag : tag;
  trace = typeof logTrace === "boolean" ? logTrace : trace;
  if (ravenUrl && !ravenClient) {
    ravenClient = initRaven(ravenUrl);
  }
}

// Helper function to add stuff to logging
function logBase(consoleFunc: (...a: any[]) => void,
                 level: Level, prefix: string, args: any[]) {

  // Don't log if silenced
  var minLevel: Level = level;
  if (level < minLevel) { return; }

  // Add prefix tag
  args.unshift(prefix ? tag + " " + prefix : tag);

  if (consoleFunc !== console.error && trace && console.trace) {
    if (self.navigator.userAgent.indexOf("Chrome") >= 0) {
      // Chrome's console.trace actually shows message in trace, so replace
      // consoleFunc with trace
      consoleFunc = console.trace;
    } else {
      // Add an extra trace message
      (<any> console).trace("Tracing ...");
    }
  }

  // Log
  consoleFunc.apply(console, args);
};

/* debug */
export function debug(...a: any[]) {
  logBase(console.debug, Level.DEBUG, "D", a);
}
export var d = debug;

/* info */
export function info(...a: any[]) {
  logBase(console.info, Level.INFO, "I", a);
}
export var i = info;

/* warning */
export function warn(...a: any[]) {
  logBase(console.warn, Level.WARN, "W", a);
}
export var w = warn;

/* error - all errors are also logged with Raven */
export function error(error: string|Error, details?: any) {
  logToRaven(error, details);
  logBase(console.error, Level.ERROR, "E", [error, details]);
}
export var e = error;

// Logs error to Raven -- converts strings to Error
export function logToRaven(error: string|Error, details?: any) {
  if (error instanceof Error) {
    logErrToRaven(error, details);
  } else {
    // Create error object to log so we get a traceback
    try {
      throw new Error(error);
    } catch (err) {
      logErrToRaven(err, details);
    }
  }
}

// Logs error with optional details
function logErrToRaven(error: Error, details?: any) {
  /*
    Sanity check since Raven isn't loaded in dev. We load Raven into
    global scope in another module to control dependency issues.
  */
  if (ravenClient) {
    if (details) {
      ravenClient.captureException(error, {
        extra: details
      });
    } else {
      ravenClient.captureException(error);
    }
  }
}

// Treat unhandledrejections as errors
self.addEventListener("unhandledrejection", function (event: any) {
  error(event.reason);
});

/* Throws an error if something failed */
export function assert(x: boolean, message: string = "Assertion failed.") {
  if (x !== true) {
    throw new Error(message);
  }
}
