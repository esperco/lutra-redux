/*
  Simple landing page JS
*/

// Webpack - Load everything in the assets dir during the build
require.context("assets", true, /.*$/);

/*
  Webpack - Require all HTML pages (excludes partials that start with _).
  Note on regex - seems to include at least part of path `./` or `/` in
  the path tested
*/
require.context("html", true, /[\/\\][a-zA-Z].+\.html$/);

// Shared landing CSS
require("less/landing.less");


//////////////

/*
  Type for passive event listener.
  See https://github.com/Microsoft/TypeScript/issues/9548
*/
interface WhatWGEventListenerArgs {
  capture?: boolean;
}

interface WhatWGAddEventListenerArgs extends WhatWGEventListenerArgs {
  passive?: boolean;
  once?: boolean;
}

type WhatWGAddEventListener = (
  type: string,
  listener: (this: HTMLElement, event: Event) => void,
  options?: WhatWGAddEventListenerArgs
) => void;

/*
  Update the "pinned" status of our header as applicable.
*/
function updateHeaderPin() {
  let header = document.querySelector(".landing-header");
  if (header && header.classList) {
    let scrollTop = document.body.scrollTop || window.pageYOffset;
    if (scrollTop && scrollTop > 48) { // 3rem on most browsers
      header.classList.add("pinned");
    } else {
      header.classList.remove("pinned");
    }
  }
}

// Tie this to scroll listeners, init on load
(window.addEventListener as WhatWGAddEventListener)(
  "scroll", updateHeaderPin, { passive: true }
);
updateHeaderPin();
