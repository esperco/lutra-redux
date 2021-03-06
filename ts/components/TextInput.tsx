/*
  An input with a default input value and some additional keyDown mappings
*/
import * as React from "react";

export interface BaseProps {
  id?: string;
  className?: string;
  placeholder?: string;
  disabled?: boolean;
}

export interface Props extends BaseProps {
  // The "default" or original value
  value: string;

  // Callback
  onChange: (newValue: string) => void;
  onSubmit?: () => void;
}

export class TextInput extends React.Component<Props, {}> {
  render() {
    return <input type="text"
      { ...this.props }
      onKeyDown={(e) => this.inputKeydown(e)}
      onChange={
        (e) => this.onChange((e.target as HTMLInputElement).value)
      }
    />;
  }

  onChange(val: string) {
    this.props.onChange(val);
  }

  // Catch enter / esc keys
  inputKeydown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.keyCode === 13) {         // Enter
      e.preventDefault();
      this.props.onSubmit && this.props.onSubmit();
    } else if (e.keyCode === 27) {  // ESC
      e.preventDefault();
      this.reset();
    }
  }

  reset() {
    this.props.onChange("");
  }
}

export default TextInput;