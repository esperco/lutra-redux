/*
  A selector that lets you select a bunch of checkboxes -- results
  are mapped to the AllSomeNone type.
*/

import * as _ from "lodash";
import * as React from "react";
import * as ASN from "../lib/asn";
import CheckboxItem from "../components/CheckboxItem";
import { colorForText } from "../lib/colors";

// Default delay before triggering callback
const DEFAULT_DELAY = 1000; // milliseconds

interface Choice {
  id: string;
  displayAs: string|JSX.Element;
  color?: string;
}

interface Props {
  selected?: ASN.AllSomeNone;
  onChange: (x: ASN.AllSomeNone) => void;
  delay?: number;  // milliseconds
  className?: string;

  // If allText or noneText are not specified, those options do not appear
  allText?: string|JSX.Element;
  noneText?: string|JSX.Element;
  choices: Choice[];
}

interface State {
  selected: ASN.AllSomeNone;
}

// If no selected, assume it means this
const DEFAULT_ASN: ASN.AllSomeNone = {
  all: true,
  none: true
};

export class DelayedASNSelector extends React.Component<Props, State> {
  _timeout: number;

  constructor(props: Props) {
    super(props);
    this.state = {
      selected: this.props.selected || DEFAULT_ASN
    };
  }

  componentWillReceiveProps(nextProps: Props) {
    this.setState({
      selected: nextProps.selected || DEFAULT_ASN
    });
  }

  render() {
    return <div className={this.props.className}>
      { this.props.allText ? <div>
        <CheckboxItem key="all"
          checked={!!this.state.selected.all}
          onChange={(v) => this.update({ all: v })}>
          { this.props.allText }
        </CheckboxItem>
      </div> : null }

      <div>
        { _.map(this.props.choices, (choice) =>
          <CheckboxItem key={"choice-" + choice.id}
            checked={ASN.isSelected(this.state.selected, choice.id)}
            onChange={(v) => this.toggle(choice.id, v)}
            background={choice.color}
            color={choice.color ? colorForText(choice.color) : undefined}>
            { choice.displayAs }
          </CheckboxItem>
        ) }
      </div>

       { this.props.noneText ? <div>
        <CheckboxItem key="none"
          checked={!!this.state.selected.none}
          onChange={(v) => this.update({ none: v })}>
          { this.props.noneText }
        </CheckboxItem>
      </div> : null }
    </div>;
  }

  toggle(key: string, value: boolean) {
    let delta: Record<string, boolean> = {};
    delta[key] = value;
    this.update({ some: delta });
  }

  update(delta: ASN.AllSomeNone) {
    let selected = ASN.update(
      this.state.selected,
      delta,
      _.map(this.props.choices, (c) => c.id)
    );
    this.setState({ selected });
    this.setTimeout();
  }

  setTimeout() {
    clearTimeout(this._timeout);
    this._timeout = setTimeout(() => {
      // Update only if different
      if (! _.isEqual(this.state.selected, this.props.selected)) {
        this.props.onChange(this.state.selected);
      }
    }, _.isNumber(this.props.delay) ? this.props.delay : DEFAULT_DELAY);
  }
}

export default DelayedASNSelector;