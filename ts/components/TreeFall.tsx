/*
  "If a tree falls and no one is around to hear it, does it make a sound?"

  Abstract base class for component that only updates if it is visible.
*/
import * as React from 'react';
import * as $ from 'jquery';
import * as ReactDOM from 'react-dom';
import Waypoint from "../components/Waypoint";

export abstract class TreeFall<P, S> extends React.Component<P, S> {
  _pending: boolean;

  componentWillReceiveProps() {
    this._pending = true; // New props, signal that there is an update queued
  }

  shouldComponentUpdate() {
    let node = ReactDOM.findDOMNode(this);

    // Update if visible
    if (node) {
      let jq = $(node);
      let top = jq.position().top;
      let bottom = top + jq.outerHeight();
      let parent = jq.offsetParent();
      return top <= parent.outerHeight() && bottom >= 0;
    }

    // Edge case -- not mounted (yet). Return true to be safe.
    return true;
  }

  componentDidUpdate() {
    this._pending = false;
  }

  abstract render(): JSX.Element|null;

  /*
    Renders a waypoint bound to the update function. Use this in sub-classed
    render function to trigger updates when user scrolls back into view.
  */
  renderWaypoint() {
    return <Waypoint onEnter={this.maybeUpdate} />;
  }

  // Update only if there is a pending update for this day
  maybeUpdate = () => {
    if (this._pending) {
      this._pending = false; // Set false right away in case function fired
                             // multiple times (e.g. because two waypoints)
      this.forceUpdate();
    }
  }
}

export default TreeFall;