/* Webpack entry point for single event page */

// This causes Webpack to load everything in the assets dir during the build
var _req = require.context("./assets", true, /.*$/);

// JS vendor files to stick in global scope
window.jQuery = window.$ = window.JQuery = require("jquery");

// Typescript entry point
require("./ts/tb.js/index.tsx");

// LESS
require("./less/tb.less");

// HTML files
require("./html/tb.html");
