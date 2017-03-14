/*
  Generic error mesage display
*/

require("less/components/_error-msg.less");
import * as React from "react";
import * as _ from "lodash";
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
    if (_.isEmpty(this.props.errors)) return null;
    return <div className={this.props.className}>
      { _.map(this.props.errors || [], (err) =>
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
