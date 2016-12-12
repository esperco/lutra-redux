/*
  A responsive dropdown:

  <Components.Dropdown keepOpen={true}
    toggle={<button>
      Toggle Dropdown
    </button>}

    menu={<div className="dropdown-menu panel">
      Dropdown menu options
    </div>}
  />

  First child should be the trigger element. Second child should be the
  dropdown menu. All other elements are ignored.

  TODO: Testing
*/

import * as React from "react";
import FocusTrap from "./FocusTrap";
import Overlay from "./Overlay";
import * as classNames from "classnames";
import * as Log from "../lib/log";
import * as $ from "jquery";

const DROPDOWN_CONTAINER_ID = "esper-dropdown";

interface Props {
  toggle: JSX.Element;
  menu: JSX.Element;
  keepOpen?: boolean;
  onOpen?: () => void;
  onClose?: () => void;
}

interface State {
  open: boolean;
}

export class Dropdown extends React.Component<Props, State> {
  _wrapper: HTMLElement;

  constructor(props: Props) {
    super(props);
    this.state = {
      open: false
    };
  }

  render() {
    let toggle = React.cloneElement(this.props.toggle, {
      ref: (c: HTMLElement) => this._wrapper = c,
      onClick: (e: React.MouseEvent<HTMLElement>) => this.open(e)
    });

    return <Overlay
      id={DROPDOWN_CONTAINER_ID}
      inline={toggle}
      append={this.state.open ? this.getAppend() : undefined}
    />;
  }

  open(e: React.MouseEvent<HTMLElement>) {
    if (! this.state.open) {
      this.setState({ open: true });
      if (this.props.onOpen) {
        this.props.onOpen();
      }
    }
  }

  close() {
    this.setState({ open: false });
    if (this.props.onClose) {
      this.props.onClose();
    }
  }

  getAppend() {
    // Actual toggle should have been rendered in DOM -- we need this
    // to calculate menu position
    if (!this._wrapper) {
      Log.e("getAppend called without active toggle");
      return;
    }

    let backdrop = <div className="backdrop" onClick={() => this.close()}>
      <DropdownMenu anchor={this._wrapper} keepOpen={this.props.keepOpen}>
        { this.props.menu }
      </DropdownMenu>
    </div>;

    return <FocusTrap target={backdrop} />;
  }

  // Close Dropdown on ESC
  componentDidMount() {
    document.addEventListener('keydown', this.onEsc);
  }

  componentWillUnmount() {
    document.removeEventListener('keydown', this.onEsc)
  }

  onEsc = (e: Event) => {
    if (e instanceof KeyboardEvent) {
      if (e.keyCode === 27 && this.state.open) {
        this.setState({ open: false });
      }
    }
  }
}


/*
  Above component is just the trigger -- this is the acutal menu that gets
  rendered
*/
interface MenuProps {
  anchor: HTMLElement;
  keepOpen?: boolean;
  children?: JSX.Element[];
}

// Desktop only -- mobile is simpler
export class DropdownMenu extends React.Component<MenuProps, {}> {
  _wrapper: HTMLDivElement;

  render() {
    if (! this.props.anchor) {
      Log.e("DropdownMenu called without anchor");
      return null;
    }
    let anchor = $(this.props.anchor);
    let offset = anchor.offset() || { left: 0, top: 0 };
    let style = {
      /*
        In addition to offset, we need to consider scroll position since
        offset is relative to document, not window, but dropdown is
        position: fixed (which is relative to window)

        Math.floor because it's possible for 1px rounding errors to cause
        our wrapper to extend just slightly past edge of window, which
        triggers ugly scroll bars.
      */
      left: Math.floor(offset.left - $(window).scrollLeft()),
      top: Math.floor(offset.top - $(window).scrollTop()),

      height: anchor.outerHeight(),
      width: anchor.outerWidth()
    };

    // Adjust horizontal alignment based on position
    let hAlign = (() => {
      let width = $(window).width();

      // Near left edge of screen
      if (style.left / width < 0.15) {
        return "left";
      }

      // Near right edge of screen
      if ((style.left + style.width) / width > 0.85) {
        return "right";
      }

      // In the middle
      return "center"
    })();

    // Drop-up if top is too low
    let vAlign = (style.top + style.height) / $(window).height() > 0.7 ?
      "up" : "down";

    let classes = classNames("dropdown-wrapper", "open", vAlign, hAlign);
    return <div ref={(c) => this._wrapper = c}
                className={classes} style={style}
                onClick={(e) => this.props.keepOpen && e.stopPropagation()}>
      { this.props.children }
    </div>;
  }

  // Apply CSS corrections after rendering to prevent breaking window edge
  componentDidMount() {
    this.adjust();
  }

  componentDidUpdate() {
    this.adjust();
  }

  adjust() {
    if (! this._wrapper) return;
    let wrapper = $(this._wrapper);
    let menu = wrapper.children().first();

    /*
      Apply max-height -- calculated as the difference between the offset
      of the menu (calculated in the same manner the wrapper) and the window
      height.
    */
    let maxHeight = $(window).height() - menu.offset().top
                    + $(window).scrollTop();
    menu.css({
      "max-height": maxHeight * 0.9, // Buffer slightly
      "overflow": "auto"
    });

    // Too far left?
    let hPos = menu.offset().left - $(window).scrollLeft();
    if (hPos < 0) {
      wrapper
        .removeClass("right")
        .removeClass("center")
        .addClass("left");
    }

    // Too far right?
    else if (hPos + menu.outerWidth() > $(window).width()) {
      wrapper
        .removeClass("left")
        .removeClass("center")
        .addClass("right");
    }
  }
}

export default Dropdown;
