/*
  Generic Esper loading page
*/

import * as React from "react";

interface Props {}
interface State {}

class Loading extends React.Component<Props, State> {
  render() {
    return <div>
      <div className="spinner" />
    </div>
  }
}

export default Loading;
