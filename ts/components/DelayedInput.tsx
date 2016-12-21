/*
  An input with a default input value and delayed update
*/
import * as _ from "lodash";
import * as React from "react";

// Default delay before triggering callback
const DEFAULT_DELAY = 500;

export interface Props {
  id?: string;
  className?: string;

  placeholder?: string;

  // The "default" or original value
  value: string;

  // Callback
  onUpdate: (newValue: string) => void;

  // How long to delay before triggering callback -- defaults to
  // DEFAULT_DELAY above
  delay?: number;
}

interface State {
  // The current value in the input
  value: string;
}

export class DelayedInput extends React.Component<Props, State> {
  _timeout: number;

  constructor(props: Props) {
    super(props);
    this.state = { value: this.props.value };
  }

  render() {
    return <input type="text" id={this.props.id}
      className={this.props.className}
      placeholder={this.props.placeholder}
      value={this.state.value || ""}
      onKeyDown={(e) => this.inputKeydown(e)}
      onChange={
        (e) => this.onChange((e.target as HTMLInputElement).value)
      }
    />;
  }

  onChange(val: string) {
    this.setState({ value: val });
    this.setTimeout();
  }

  // Catch enter / esc keys
  inputKeydown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.keyCode === 13) {         // Enter
      e.preventDefault();
      clearTimeout(this._timeout);
      this.props.onUpdate(this.state.value);
    } else if (e.keyCode === 27) {  // ESC
      e.preventDefault();
      this.reset();
    }
  }

  setTimeout() {
    clearTimeout(this._timeout);
    this._timeout = setTimeout(
      () => this.props.onUpdate(this.state.value),
      _.isNumber(this.props.delay) ? this.props.delay : DEFAULT_DELAY
    );
  }

  reset() {
    clearTimeout(this._timeout);
    this.setState({ value: "" });
    this.props.onUpdate("");
  }

  componentWillReceiveProps(nextProps: Props) {
    clearTimeout(this._timeout);
    this.setState({value: nextProps.value});
  }

  componentWillUnmount(){
    clearTimeout(this._timeout);
  }

  getValue() {
    return this.state.value;
  }
}

export default DelayedInput;