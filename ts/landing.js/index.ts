/*
  Simple landing page JS
*/

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
    if (scrollTop) { // > 0
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
