/*
  Component for selecting from a list of options
*/

import * as React from 'react';
import RadioItem from "./RadioItem";
import { colorForText } from "../lib/colors";
import { OrderedSet, randomString } from "../lib/util";

export interface Choice {
  // Content will also be wrapped inside checkbox label
  original: string|JSX.Element;

  // Normalized choices -- menu filters after normalization
  normalized: string;

  // If color, used as background for tag and checkbox color for list
  color?: string;
}

export interface Props {
  // All choices
  choices: OrderedSet<Choice>;

  // Selected choice
  selected?: Choice;

  // Selecting an existing choice
  onSelect: (choice: Choice) => void;
}

export class Menu extends React.Component<Props, {}> {
  name: string;

  constructor(props: Props) {
    super(props);
    this.name = randomString(); // Name for menu (must be unique)
  }

  render() {
    return <div className="menu">
      { this.props.choices.map((c) =>
        <RadioItem key={c.normalized}
            name={this.name}
            checked={!!this.props.selected &&
                     this.props.selected.normalized === c.normalized}
            onChange={(v) => v && this.props.onSelect(c)}
            background={c.color}
            color={c.color ? colorForText(c.color) : undefined}>
          { c.original }
        </RadioItem>
      )}
    </div>;
  }
}

export default Menu;