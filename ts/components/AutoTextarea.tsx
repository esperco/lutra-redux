/*
  A textarea that automatically saves its content. It waits until prior
  saves before calling onChange again.
*/

import * as React from "react";
import delay from "./DelayedControl";
import Icon from "./Icon";
import Queue from "../lib/queue";
import * as Text from "../text/common";

interface Props {
  placeholder?: string;
  value: string;
  onChange: (val: string) => Promise<any>;
}

interface State {
  stale: boolean; // Content stale? Can we save?
}

export class AutoTextarea extends React.Component<Props, State> {
  private queue: Queue<string>;

  constructor(props: Props) {
    super(props);
    this.state = {
      stale: false,
    };

    // Internal queue to handle multiple submissions
    this.queue = new Queue(async (vals: string[]) => {
      if (vals.length) {
        await this.props.onChange(vals[vals.length - 1]);
      }
      return [];
    });
  }

  render() {
    return delay({
      value: this.props.value,
      onChange: this.onChange,
      component: (p) => <div>
        <textarea
          placeholder={this.props.placeholder}
          value={p.value}
          onChange={(e) => {
            if (! this.state.stale) this.setState({ stale: true });
            p.onChange(e.target.value);
          }}
        />
        <footer>
          <span /> {/* Spacer */}
          <button onClick={p.onSubmit} disabled={!this.state.stale}>
            <Icon type="save">
              { this.state.stale ? Text.Save : Text.Saved }
            </Icon>
          </button>
        </footer>
      </div>
    });
  }

  onChange = (v: string) => {
    if (this.state.stale) this.setState({ stale: false });
    this.queue.enqueue(v);
  };
}

export default AutoTextarea;