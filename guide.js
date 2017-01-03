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
  $('.show-left-btn').click(function() {
    $("#sidebar-layout").addClass("show-left");
    $("#sidebar-layout").removeClass("hide-left");
  });

  $('.switch-left-btn').click(function() {
    $("#sidebar-layout").addClass("show-left");
    $("#sidebar-layout").removeClass("hide-left");
    $("#sidebar-layout").addClass("hide-right");
    $("#sidebar-layout").removeClass("show-right");
  });

  $('.hide-left-btn').click(function() {
    $("#sidebar-layout").addClass("hide-left");
    $("#sidebar-layout").removeClass("show-left");
  });

  $('.show-right-btn').click(function() {
    $("#sidebar-layout").addClass("show-right");
    $("#sidebar-layout").removeClass("hide-right");
  });

  $('.switch-right-btn').click(function() {
    $("#sidebar-layout").addClass("show-right");
    $("#sidebar-layout").removeClass("hide-right");
    $("#sidebar-layout").addClass("hide-left");
    $("#sidebar-layout").removeClass("show-left");
  });

  $('.hide-right-btn').click(function() {
    $("#sidebar-layout").addClass("hide-right");
    $("#sidebar-layout").removeClass("show-right");
  });

  $('#sidebar-layout .backdrop').click(function() {
    $("#sidebar-layout").addClass("hide-right hide-left");
    $("#sidebar-layout").removeClass("show-right show-left");
  });
});

// TypeScript (for React components)
require("./ts/guide.js/index.tsx");