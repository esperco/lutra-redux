/*
  Generic Esper wrapper with header and footer
*/

import * as React from "react";
import ErrorMsg from "./ErrorMsg";
import { ErrorAction, ErrorMsgState } from "../states/error-msg";
import DataStatus from "./DataStatus";
import { DataState } from "../states/data-status";

interface Props {
  children?: JSX.Element|JSX.Element[]|string;
  state: ErrorMsgState & DataState;
  dispatch: (a: ErrorAction) => any;
}

interface State {}

class App extends React.Component<Props, State> {
  render() {
    return <div>
      <div className="content">
        { this.props.children }
      </div>
      <DataStatus { ...this.props.state } />
      <ErrorMsg
        errors={this.props.state.errors}
        onDismiss={(code, detail) => this.props.dispatch({
          type: "RM_ERROR",
          value: detail ? detail.tag : code
        })}
      />
    </div>
  }
}

export default App;
