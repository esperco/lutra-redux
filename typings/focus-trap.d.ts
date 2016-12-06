/*
  Typings for https://github.com/davidtheclark/focus-trap
*/

declare namespace FocusTrap {
  interface FocusTrap {
    activate: () => void;
    deactivate: (opts?: {
      returnFocus?: boolean;
      onDeactivate?: null|false|Function;
    }) => void;
    pause: () => void;
    unpause: () => void;
  }

  interface Options {
    onActivate?: () => void;
    onDeactivate?: () => void;
    initialFocus?: Element|string;
    fallbackFocus?: Element|string;
    escapeDeactivates?: boolean;
    clickOutsideDeactivates?: boolean;
    returnFocusOnDeactivate?: boolean;
  }

  interface CreateFocusTrap {
    (element: Element|string, opts?: Options): FocusTrap;
  }
}

declare module "focus-trap" {
  var f: FocusTrap.CreateFocusTrap;
  export = f;
}
