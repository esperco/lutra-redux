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

  /*
    Update state based on new props only if no timeout is pending. Otherwise,
    we might clobber user input that hasn't posted yet.
  */
  componentWillReceiveProps(newProps: Props<T>) {
    if (_.isUndefined(this._timeout)) {
      this.setState({ value: newProps.value });
    }
  }

  componentWillUnmount(){
    this.clearTimeout();
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
    this.clearTimeout();

    // Wrap in RAF so any changes called synchronously with submit can
    // update state
    window.requestAnimationFrame(
      () => this.props.onChange(this.state.value)
    );
  }

  /*
    If there's a submit button external to delayed component, parent
    component should maintain ref to this component and call getAndClear
    on the ref.

    This clears the timeout to prevent double-posting and returns a value
    for the parent component to manually submit.
  */
  getAndClear() {
    this.clearTimeout();
    return this.state.value;
  }

  setTimeout() {
    this.clearTimeout();
    this._timeout = setTimeout(() => {
      this.clearTimeout();
      this.props.onChange(this.state.value);
    }, _.isNumber(this.props.delay) ? this.props.delay : DEFAULT_DELAY);
  }

  /*
    Need to delete _timeout as well so presence of _timeout variable accurately
    tells us whether a timeout is pending -- see componentWillReceiveProps
  */
  clearTimeout() {
    clearTimeout(this._timeout);
    delete this._timeout;
  }
}

/*
  Function wrapper around component because the generic typing acts a bit
  weirdly here.
*/
export default function delayedControl<T>(props: Props<T> & {
  ref?: (c: DelayedControl<T>) => any;
}) {
  return React.createElement(DelayedControl, props);
};

