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
require.context("html", true, /[\/\\][a-zA-Z0-9].+\.html$/);

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



/* -------------------------------------
  Request Demo button for /contact
------------------------------------- */


import { validateEmailAddress } from "../lib/util";
import Api from "../lib/api";
import * as Conf from "config";
Api.init(Conf);

// Hook up support email widget if applicable
declare var requestDemo: {
  demoForm: HTMLFormElement,
  reset: () => void,
  busy: () => void,
  error: () => void,
  success: () => void,
  invalidEmail: () => void,
  getValue: () => string
}|undefined;

if (typeof requestDemo !== "undefined") {
  let cbs = requestDemo;

  requestDemo.demoForm.addEventListener("submit", (event) => {
    event.preventDefault();
    event.target;

    cbs.reset();
    let email = cbs.getValue();
    if (validateEmailAddress(email)) {
      cbs.busy();
      Api.sendSupportEmail(email + " requested demo").then(() => {
        cbs.success();
      }).catch((err) => {
        cbs.error();
        throw err;
      });
    } else {
      cbs.invalidEmail();
    }
  }, false);
}


/* -------------------------------------
  Try Demo button for /charts
------------------------------------- */

import LocalStore from "../lib/local-store";
import { storedLoginKey } from "../lib/login";

let sandboxBtn = document.getElementById("demo-btn") as HTMLButtonElement|null;
if (sandboxBtn) {
  let btn = sandboxBtn;
  btn.addEventListener("click", (event) => {
    event.preventDefault();
    btn.disabled = true;
    btn.innerHTML = "Loading &hellip;";
    Api.sandboxSignup().then((info) => {
      LocalStore.set(storedLoginKey, {
        uid: info.uid,
        api_secret: info.api_secret,
        email: info.email
      });
      location.href = "/time";
    }).catch((err) => {
      btn.innerHTML = "Error";
      throw err;
    })
  });
}