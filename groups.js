/* Webpack entry point for Groups */

// This causes Webpack to load everything in the assets dir during the build
var _req = require.context("./assets", true, /.*$/);

// JS vendor files to stick in global scope
window.jQuery = window.$ = window.JQuery = require("jquery");

// Web worker
if (window.Worker) {
  /*
    Require as web worker.

    Note that pending https://github.com/webpack/worker-loader/pull/29/files,
    the name attribute is ignored and we get a "main.worker" file instead.
    This is fine for now, but if we start using workers for things other than
    groups (i.e. EA/Exec time stats), we'll need to fork the worker-loader
    and patch so it properly names things.
  */
  var Worker = require("worker-loader?name=groups!./ts/groups.js/worker.ts");
  window.GroupWorker = new Worker;
} else {
  // No web-worker. Unsupported browser.
  let update = confirm(
    "Esper requires a modern browser to function properly. Please " +
    "update your browser before continuing."
  );
  if (update) location.href = "https://outdatedbrowser.com/";
}

// Typescript entry point
require("./ts/groups.js/index.tsx");

// LESS
require("./less/groups.less");

// HTML files
require("./html/groups.html");
