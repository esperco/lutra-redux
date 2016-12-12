/*
  It's sometimes helpful to have React components that get rendered as part
  of a normal React flow, but that we want to show in the DOM outside of
  how it shows up in React to get around z-indexing issues, etc.

  For instance, dropdown toggles should show up in the DOM flow in one place
  but the actual dropdown menu may need to sit outside of where the toggle is.

  Usage:

    <Overlay
      inline={<div>
        This shows up inline
      </div>}

      append={<div>
        This is appended to the end of the body
      </div>}
    />
*/

import * as React from "react";
import * as ReactDOM from "react-dom";
import * as $ from "jquery";

interface Props {
  /*
    A unique identifier for this overlay or type of overlay. Overlays
    with the same id will replace any existing overlay with that id.
  */
  id: string;

  // This gets rendered inline if provided
  inline?: JSX.Element;

  // This is what gets appended to the end of the <body />. Leave out to hide
  // or remove overlay.
  append?: JSX.Element;
}

export class Overlay extends React.Component<Props, {}> {
  // Don't actually render anything inline here.
  render() {
    if (typeof this.props.inline === "undefined") {
      return null;
    } else {
      return this.props.inline;
    }
  }

  componentDidMount() {
    this.update();
  }

  componentDidUpdate() {
    this.update();
  }

  componentWillUnmount() {
    this.close();
  }

  /*
    requestAnimationFrame to avoid accessing DOM node from inside
    render function. Not ideal, but should be OK so long as we
    only update the overlay children and not the wrapper itself.
  */
  update() {
    window.requestAnimationFrame(() => this.renderOverlay());
  }

  /*
    Create container for id (if it doesn't exist) and render overlay content
    inside it.
  */
  renderOverlay() {
    var container = $("#" + this.props.id);
    if (!container || !container.length) {
      container = $('<div>').attr("id", this.props.id);
      $('body').append(container);
    }
    if (this.props.append) {
      ReactDOM.render(this.props.append, container.get(0));
    } else {
      this.clearOverlay();
    }
  }

  /*
    requestAnimationFrame because any React events that triggered the
    dropdown menu closing may need to fully propogate before we remove
    the menu from the DOM.
  */
  close() {
    window.requestAnimationFrame(() => this.clearOverlay());
  }

  /*
    Clean up overlay content -- requires id since props don't stick around
    if called from RAF.
  */
  clearOverlay() {
    var container = $("#" + this.props.id);
    if (container.length) {
      ReactDOM.unmountComponentAtNode(container.get(0));
      container.remove();
    }
  }
}

export default Overlay;