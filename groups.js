/* Webpack entry point for Groups */

// JS vendor files to stick in global scope
window.jQuery = window.$ = window.JQuery = require("jquery");

// Typescript entry point
require("./ts/groups.js/index.tsx");

// LESS
require("./less/groups.less");

// HTML files
require("./html/groups.html");
