/*
  Wrapper around TextInput with with self contained state
*/

import * as React from "react";
import { default as TextInput, BaseProps } from "./TextInput";

interface Props extends BaseProps {
  defaultValue?: string;

  // Callback -- call input.val() to get val on submit
  onSubmit: () => void;
}

interface State {
  value: string;
}

export class SubmitInput extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      value: props.defaultValue || ""
    };
  }

  render() {
    let { defaultValue, ...props } = this.props;
    return <TextInput
      {...props}
      value={this.state.value}
      onChange={this.change}
      onSubmit={this.submit}
    />;
  }

  change = (value: string) => this.setState({ value });
  submit = () => this.props.onSubmit();

  val() {
    return this.state.value;
  }

  reset() {
    this.setState({ value: "" });
  }
}

export default SubmitInput;