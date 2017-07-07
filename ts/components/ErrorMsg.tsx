/*
  Generic error mesage display
*/

require("less/components/_error-msg.less");
import * as React from "react";
import Icon from "./Icon";
import { ErrorDetails } from "../lib/errors";
import { getText, ContactText } from "../text/error-text";

interface Props {
  className?: string;
  errors?: {
    code: number;
    details?: ErrorDetails;
  }[];
  onDismiss: (code: number, details?: ErrorDetails) => void;
}

interface State {}

class ErrorMsg extends React.Component<Props, State> {
  render() {
    if (!this.props.errors || !this.props.errors.length) return null;
    return <div className={this.props.className}>
      { (this.props.errors || []).map((err) =>
        <div key={err.details ? err.details.tag : err.code} className="error">
          <span>
            { getText(err.code, err.details) }
          </span>
          <button onClick={() => this.props.onDismiss(err.code, err.details)}>
            <Icon type="dismiss" />
          </button>
        </div>
      ) }
      <div className="contact-info">
        { ContactText }
      </div>
    </div>;
  }
}

export default ErrorMsg;
