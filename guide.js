/* Webpack entry point for style guide */

// JS vendor files to stick in global scope
window.jQuery = window.$ = window.JQuery = require("jquery");

// LESS
require("./less/guide.less");

// HTML files
require("./html/guide.html");
