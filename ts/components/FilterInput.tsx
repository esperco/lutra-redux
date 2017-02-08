/*
  Input box with handlers for up/down/esc
*/

import * as React from 'react';

export interface Props {
  id?: string;
  className?: string;
  placeholder?: string;
  value: string;
  onChange: (newValue: string) => void;
  onSubmit?: () => void;
  onUp?: () => void;
  onDown?: () => void;
}

export class FilterInput extends React.Component<Props, {}> {
  render() {
    let { id, className, placeholder, value } = this.props;
    let inputProps = { id, className, placeholder, value };
    return <input {...inputProps}
      onKeyDown={(e) => this.inputKeydown(e)}
      onChange={(e) => this.change(e)}
    />;
  }

  inputKeydown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.keyCode === 13) { // Enter
      e.preventDefault();
      if (this.props.onSubmit) { this.props.onSubmit(); }
    }

    else if (e.keyCode === 27) {    // Esc
      e.preventDefault();
      this.props.onChange("");      // Clear
    }

    else if (e.keyCode === 38) {    // Up
      e.preventDefault();
      if (this.props.onUp) { this.props.onUp(); }
    }

    else if (e.keyCode === 40) {    // Down
      e.preventDefault();
      if (this.props.onDown) { this.props.onDown(); }
    }
  }

  change(e: React.FormEvent<HTMLInputElement>) {
    this.props.onChange((e.target as HTMLInputElement).value);
  }
}

export default FilterInput;