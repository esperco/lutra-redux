import * as React from "react";

interface Props {
  name: string;
}

interface State {}

class Hello extends React.Component<Props, State> {
  render() {
    return <div>
      Hello {this.props.name}
    </div>;
  }
}

export default Hello;
