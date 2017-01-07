/*
  A container that fires a callback when it scrolls down and fires again when
  it scrolls up. Callback is fired only on first scroll and when scroll
  direction changes (e.g. scrolling down multiple times only results in
  one callback).
*/
import * as _ from 'lodash';
import * as React from 'react';

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

interface Props extends React.HTMLProps<HTMLDivElement> {
  onScrollChange: (direction: "up"|"down") => void;
  children?: JSX.Element|JSX.Element[]|string;
}

export class ScrollContainer extends React.Component<Props, {}> {
  _div?: HTMLDivElement;
  _lastDirection?: "up"|"down";
  _lastScrollTop: number;

  render() {
    let divProps = _.clone(this.props);
    delete divProps.onScrollChange;
    return <div {...divProps} ref={(c) => this._div = c}>
      { this.props.children }
    </div>;
  }

  componentDidMount() {
    /*
      We do this instead of using React's native onScroll handler because
      that handler doesn't support passive evets yet.

      See https://github.com/facebook/react/issues/6436
    */
    if (this._div) {
      (this._div.addEventListener as WhatWGAddEventListener)(
        "scroll", this.onScroll, { passive: true }
      );
    }
  }

  componentWillUnmount() {
    if (this._div) {
      this._div.removeEventListener("scroll", this.onScroll);
    }
  }

  onScroll = () => {
    if (this._div) {
      let current = this._div.scrollTop;
      let last = this._lastScrollTop || 0;
      this._lastScrollTop = current;

      // Scroll down
      if (current > last) {
        if (this._lastDirection !== "down") {
          this._lastDirection = "down";
          this.props.onScrollChange("down");
        }
      }

      // Scroll up
      else if (current < last) {
        if (this._lastDirection !== "up") {
          this._lastDirection = "up";
          this.props.onScrollChange("up");
        }
      }
    }
  }
}

export default ScrollContainer;