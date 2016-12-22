/*
  A selector that lets you select a bunch of checkboxes -- results
  are mapped to the AllSomeNone type.
*/

import * as _ from "lodash";
import * as React from "react";
import * as ASN from "../lib/asn";
import CheckboxItem from "../components/CheckboxItem";
import { colorForText } from "../lib/colors";

interface Choice {
  id: string;
  displayAs: string|JSX.Element;
  color?: string;
}

interface Props {
  selected?: ASN.AllSomeNone;
  onChange: (x: ASN.AllSomeNone) => void;
  className?: string;

  // If allText or noneText are not specified, those options do not appear
  allText?: string|JSX.Element;
  noneText?: string|JSX.Element;
  choices: Choice[];
}

// If no selected, assume it means this
const DEFAULT_ASN: ASN.AllSomeNone = { all: true };

export class ASNSelector extends React.Component<Props, {}> {
  render() {
    let selected = this.props.selected || DEFAULT_ASN;
    return <div className={this.props.className || "menu"}>
      { this.props.allText ? <CheckboxItem key="all"
        checked={!!selected.all}
        onChange={(v) => this.update({ all: v })}>
        { this.props.allText }
      </CheckboxItem> : null }

      { _.map(this.props.choices, (choice) =>
        <CheckboxItem key={"choice-" + choice.id}
          checked={ASN.isSelected(selected, choice.id)}
          onChange={(v) => this.toggle(choice.id, v)}
          background={choice.color}
          color={choice.color ? colorForText(choice.color) : undefined}>
          { choice.displayAs }
        </CheckboxItem>
      ) }

      { this.props.noneText ? <CheckboxItem key="none"
        checked={!!selected.none}
        onChange={(v) => this.update({ none: v })}>
        { this.props.noneText }
      </CheckboxItem> : null }
    </div>;
  }

  toggle(key: string, value: boolean) {
    let delta: Record<string, boolean> = {};
    delta[key] = value;
    this.update({ some: delta });
  }

  update(delta: ASN.AllSomeNone) {
    let selected = ASN.update(
      this.props.selected || DEFAULT_ASN,
      delta,
      _.map(this.props.choices, (c) => c.id)
    );
    this.props.onChange(selected);
  }
}

export default ASNSelector;