/*
  A polyfill for browser Promise and Fetch events that mimics Chrome's
  behavior. If the browser does not appear to have unhandledrejection
  support for its ES6 Promise implementation, we replace the browser's
  version with out own, less-stupid version that does dispatch this event.

  The required modules check global scope and mtuate it, so we need to
  assign to undefined first.
*/
if (typeof PromiseRejectionEvent === "undefined") {
  window.Promise = undefined;  // Nuke existing Promise implementation
  window.Promise = require("promise-polyfill"); // Then replace
  window.Promise._unhandledRejectionFn = function(err) {
    var event;
    try {
      event = new Event("unhandledrejection", {
        bubbles: true,
        cancelable: true
      });
    } catch (err) {
      // IE -- constructor not allowed
      event = document.createEvent("Event");
      event.initEvent("unhandledrejection", true, true);
    }
    event.reason = err;
    document.dispatchEvent(event);
  }

  // Nuke existing window.fetch and other Fetch related classes
  window.fetch = undefined;
  window.Headers = undefined;
  window.Request = undefined;
  window.Response = undefined;
  require("whatwg-fetch"); // Require doesn't return anything here.
}
