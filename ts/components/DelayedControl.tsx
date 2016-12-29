/*
  Generic base for a UX component that displays a particular state and
  updates immediately when changed, but delays slightly before firing
  attached callback handler.
*/
import * as _ from 'lodash';
import * as React from 'react';

const DEFAULT_DELAY = 1200;

interface BaseProps<T> {
  value: T;
  onChange: (x: T) => void; // Update displayed value
  onSubmit: () => void;     // Force onChange to fire before delay up
}

interface Props<T> {
  delay?: number; // ms
  value: T;
  onChange: (x: T) => void;
  component: (props: BaseProps<T>) => JSX.Element;
}

interface State<T> {
  value: T;
}

export class DelayedControl<T> extends React.Component<Props<T>, State<T>> {
  _timeout: number;

  constructor(props: Props<T>) {
    super(props);
    this.state = { value: props.value };
  }

  componentWillReceiveProps(newProps: Props<T>) {
    if (! _.isUndefined(this._timeout)) {
      this.setState({ value: newProps.value });
    }
  }

  componentWillUnmount(){
    clearTimeout(this._timeout);
  }

  render() {
    return this.props.component({
      value: this.state.value,
      onChange: this.change,
      onSubmit: this.submit
    });
  }

  change = (value: T) => {
    this.setState({ value });
    this.setTimeout();
  }

  submit = () => {
    clearTimeout(this._timeout);

    // Wrap in RAF so any changes called synchronously with submit can
    // update state
    window.requestAnimationFrame(
      () => this.props.onChange(this.state.value)
    );
  }

  setTimeout() {
    clearTimeout(this._timeout);
    this._timeout = setTimeout(
      () => this.props.onChange(this.state.value),
      _.isNumber(this.props.delay) ? this.props.delay : DEFAULT_DELAY
    );
  }
}

/*
  Function wrapper around component because the generic typing acts a bit
  weirdly here.
*/
export default function delayedControl<T>(props: Props<T>) {
  return React.createElement(DelayedControl, props);
};

