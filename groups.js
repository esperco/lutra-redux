/* Webpack entry point for Groups */

// This causes Webpack to load everything in the assets dir during the build
var _req = require.context("./assets", true, /.*$/);

// JS vendor files to stick in global scope
window.jQuery = window.$ = window.JQuery = require("jquery");

// Typescript entry point
require("./ts/groups.js/index.tsx");

// LESS
require("./less/groups.less");

// HTML files
require("./html/groups.html");
