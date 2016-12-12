/*
  Helper for ensuring focus doesn't leave target element (or its children).

  Similar to
  https://github.com/davidtheclark/focus-trap-react/blob/master/index.js
  but sans wrapper element.
*/

import * as React from "react";
import * as ReactDOM from "react-dom";
import * as createFocusTrap from "focus-trap";

interface Props {
  target: JSX.Element;
}

export class FocusTrapWrapper extends React.Component<Props, {}> {
  _trap: FocusTrap.FocusTrap;

  render() {
    return this.props.target;
  }

  componentDidMount() {
    let target = ReactDOM.findDOMNode(this);
    this._trap = createFocusTrap(target, {
      // In case target has no buttons, links, etc.
      fallbackFocus: target,

      // Use our own handlers + React to take care of ith
      escapeDeactivates: false,
      clickOutsideDeactivates: false
    });
    this._trap.activate();
  }

  componentWillUnmount() {
    if (this._trap) {
      this._trap.deactivate();
    }
  }
}

export default FocusTrapWrapper;