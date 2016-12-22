/*
  Configure Raven for third-party error reporting
*/
import * as Raven from 'raven-js';

declare var ESPER_VERSION: string;
if (typeof ESPER_VERSION === "undefined") {
  var ESPER_VERSION = "dev";
}

export function init(ravenUrl: string) {
  Raven.config(ravenUrl, {
    release: ESPER_VERSION,
    ignoreErrors: [
      /* Triggered by browser extensions, not our code */
      /WrappedNative/,
      /NPObject/,
      /jsclient-bucket4/,
      /__gCrWeb/
    ],
    ignoreUrls: [
      /localhost/i,

      /* Chrome extensions */
      /extensions\//i,
      /^chrome:\/\//i,

      /* Third party sites and libraries */
      /\.facebook\.com/i,
      /\.google\.com/i,
      /\.googleapis\.com/i,
      /\.intercom\.io/i,
      /\.mixpanel\.com/i,
      /\.optimizely\.com/i,
      /\.olark\.com/i,
      /\.segment\.com/i,
      /\.twitter\.com/i,

      /* Local file (if someone saves a copy of the page for some reason) */
      /file:\/\/\//i
    ]
  }).install();

  // Assign to global because that's how our scripts use it at the moment
  (<any> self).Raven = Raven;

  return Raven;
}
