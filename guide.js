/* Webpack entry point for style guide */

// JS vendor files to stick in global scope
window.jQuery = window.$ = window.JQuery = require("jquery");

// LESS
require("./less/guide.less");

// HTML files
require("./html/guide.html");

// Some standalone JS
$(document).ready(function() {
  /* Slide banner above header up and down */
  $(".banner-toggle").click(function() {
    $(".banner").toggleClass("hide");
  });

  /* Slide header up and down */
  $(".header-toggle").click(function() {
    $("header").toggleClass("hide");
  });

  /* Slide header up and down */
  $(".footer-toggle").click(function() {
    $("footer").toggleClass("hide");
  });

  /* Sidebar sliding */
  $(".sidebar-left-link").click(function() {
    $("#sidebar-layout").addClass("shift-left");
    $("#sidebar-layout").removeClass("shift-right");
  });

  $(".sidebar-right-link").click(function() {
    $("#sidebar-layout").removeClass("shift-left");
    $("#sidebar-layout").addClass("shift-right");
  });

  $(".sidebar-none-link").click(function() {
    $("#sidebar-layout").removeClass("shift-left");
    $("#sidebar-layout").removeClass("shift-right");
  });
});

// TypeScript (for React components)
require("./ts/guide.js/index.tsx");