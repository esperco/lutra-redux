/*
  Generic Esper wrapper with header and footer
*/

import * as React from "react";

interface Props {
  children?: JSX.Element|JSX.Element[]|string;
}

interface State {}

class App extends React.Component<Props, State> {
  render() {
    return <div>
      { this.props.children }
    </div>
  }
}

export default App;
