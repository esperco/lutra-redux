/* Webpack entry point for Groups */

// This causes Webpack to load everything in the assets dir during the build
var _req = require.context("./assets", true, /.*$/);

/* global requireAsset: true */
// Wrap the _req function so we don't need to use confusing relative paths
// and make it globally available (e.g. so we can access from TypeScript)
requireAsset = function(path) {
  return _req("./" + path);
};

// JS vendor files to stick in global scope
window.jQuery = window.$ = window.JQuery = require("jquery");

// Typescript entry point
require("./ts/groups.tsx");

// LESS
require("./less/groups.less");

// HTML files
require("./assets/groups.html");
