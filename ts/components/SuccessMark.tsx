/*
  Animated checkmark, based off of https://codepen.io/haniotis/pen/KwvYLO.
*/

require("less/components/_success-mark.less");
import * as React from "react";

export const SuccessMark = ({ children } : {
  children?: React.ReactNode|React.ReactNode[];
}) => <div className="success-mark-container">
  <svg className="success-mark" xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 52 52">
    <circle className="success-mark-circle" cx="26" cy="26" r="25"
      fill="none" />
    <path className="success-mark-check" fill="none"
      d="M14.1 27.2l7.1 7.2 16.7-16.8" />
  </svg>
  <div className="success-mark-msg">
    { children }
  </div>
</div>;

export default SuccessMark;