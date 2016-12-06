/*
  A component used for overlaid tooltips

    <Tooltip
      title="Hover text"
      target={<button>
        Hover over me
      </button>}
    />
*/

import * as _ from "lodash";
import * as $ from "jquery";
import * as React from "react";
import * as Log from "../lib/log";
import Overlay from "./Overlay";
import { randomString } from "../lib/util";

/*
  NB: Just prefix, not overlay id itself. We can have more than one
  tooltip active
*/
const OVERLAY_PREFIX = "esper-tooltip-";

interface Props {
  target: JSX.Element;
  title: string;
};

interface State {
  hover: boolean;
  focus: boolean;
}

export class Tooltip extends React.Component<Props, State> {
  _target: HTMLElement;
  _id: string;

  constructor(props: Props) {
    super(props);
    this._id = OVERLAY_PREFIX + randomString();
    this.state = {
      hover: false,
      focus: false
    };
  }

  render() {
    let oldMouseOver = this.props.target.props["onMouseOver"];
    let onMouseOver = (e: React.MouseEvent<HTMLElement>) => {
      if (oldMouseOver) { oldMouseOver(e); }
      this.setState({ hover: true, focus: this.state.focus });
    };
    let oldMouseOut = this.props.target.props["onMouseOut"];
    let onMouseOut = (e: React.MouseEvent<HTMLElement>) => {
      if (oldMouseOut) { oldMouseOut(e); }
      this.setState({ hover: false, focus: this.state.focus });
    };
    let oldBlur = this.props.target.props["onBlur"];
    let onBlur = (e: React.MouseEvent<HTMLElement>) => {
      if (oldBlur) { oldBlur(e); }
      this.setState({ focus: false, hover: this.state.hover });
    };
    let oldFocus = this.props.target.props["onFocus"];
    let onFocus = (e: React.MouseEvent<HTMLElement>) => {
      if (oldFocus) { oldFocus(e); }
      this.setState({ focus: true, hover: this.state.hover });
    };

    let target =  React.cloneElement(this.props.target, {
      ref: (c: HTMLElement) => this._target = c,
      onMouseOver, onMouseOut, onBlur, onFocus
    });
    return <Overlay id={this._id}
      inline={target}
      append={(this.state.focus || this.state.hover) ?
        <TooltipFloat title={this.props.title} anchor={this._target} /> :
        undefined}
    />;
  }
}

// Actual tooltip -- adjusts so not off screen
class TooltipFloat extends React.Component<{
  title: string;

  // Inline Element
  anchor: HTMLElement;
}, {}> {
  _tip: HTMLElement;

  render() {
    if (! this.props.anchor) {
      Log.e("TooltipFloat called without anchor");
      return null;
    }
    let elm = $(this.props.anchor);

    // Default -> render centered above anchor
    let offset = elm.offset() || { left: 0, top: 0 };
    let width = elm.outerWidth();
    let left = (offset.left - $(window).scrollLeft()) + (width / 2);
    let bottom = $(window).height() - (offset.top - $(window).scrollTop());
    let style = {
      left: left,
      bottom: bottom,
      transform: "translateX(-50%)"
    };

    return <span ref={(c) => this._tip = c}
                 className="tooltip-wrapper" style={style}>
      <span className="tooltip">{ this.props.title }</span>
    </span>;
  }

  componentDidMount() {
    this.adjustPosition();
  }

  componentDidUpdate() {
    this.adjustPosition();
  }

  // Move tooltip if offscreen
  adjustPosition() {
    let elm = $(this._tip);
    if (elm.length === 0) return;

    let width = elm.outerWidth();
    let offset = elm.offset() || { left: 0, top: 0 };
    let left = offset.left - $(window).scrollLeft();
    let top = offset.top - $(window).scrollTop();

    // Manually use jQuery to nudge
    let newCSS: {
      left?: number|"auto";
      right?: number|"auto";
      top?: number|"auto";
      bottom?: number|"auto";
      transform?: string;
    } = {};

    // Too far left
    if (left < 0) {
      newCSS.left = 0;
      newCSS.transform = "";
    }

    // Too far right
    else if (left + width > $(window).width()) {
      newCSS.left = "auto";
      newCSS.right = 0;
      newCSS.transform = "";
    }

    // Too high
    if (top < 0) {
      newCSS.bottom = "auto"
      let anchor = $(this.props.anchor);
      newCSS.top = _.isEmpty(anchor) ? 0 :
        (anchor.offset().top - $(window).scrollTop()) + anchor.outerHeight();
    }

    if (_.keys(newCSS).length > 0) {
      elm.css(newCSS);
    }
  }
}

export default Tooltip;

