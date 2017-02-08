/*
  Component for selecting multiple items from a list of options with a
  text input to filter options
*/

import * as React from 'react';
import * as classNames from "classnames";
import CheckboxItem from "./CheckboxItem";
import { Choice } from "./Menu";
import { SpecialChoice, BaseProps, FilterMenuBase } from "./FilterMenu";
import { colorForText } from "../lib/colors";
import { OrderedSet } from "../lib/util";

export interface Props extends BaseProps {
  // Selected choices
  selectedChoices: OrderedSet<Choice>;

  /*
    Optionally, choices that are only partially selected. When partially
    items are selected, onToggle is called with a value of true (to fully
    select them).

    May or may not be a subset of selected. The selected prop controls
    what shows up in a TagList.
  */
  partial?: OrderedSet<Choice>;

  // Toggling an existing choice
  onToggle: (choice: Choice, newVal: boolean, method: "click"|"enter") => void;
}

export class MultiselectFilterMenu extends FilterMenuBase<Props> {
  renderSpecialChoice(
    c: SpecialChoice,
    index: number,
    isActive: boolean
  ): JSX.Element {
    return <CheckboxItem key={index}
        checked={!!c.selected}
        className={classNames({
          active: isActive,
        })}
        onChange={(val) => c.onSelect(val, "click")}
        background={c.color}
        color={c.color ? colorForText(c.color) : undefined}>
      { c.displayAs }
    </CheckboxItem>;
  }

  renderChoice(c: Choice, index: number, isActive: boolean): JSX.Element {
    let selectStatus = this.selectStatus(c);
    return <CheckboxItem key={c.normalized}
        checked={selectStatus !== false}
        className={classNames({
          active: isActive,
          partial: selectStatus === "some"
        })}
        onChange={(v) => this.selectChoice(c, "click")}
        background={c.color}
        color={c.color ? colorForText(c.color) : undefined}>
      { c.original }
    </CheckboxItem>;
  }

  selectChoice(choice: Choice, method: "enter"|"click") {
    this.props.onToggle(
      choice,
      this.selectStatus(choice) !== true,
      method
    );
    this.setState(this.resetState(this.props));
  }

  selectStatus(c: Choice): boolean|"some" {
    if (this.props.partial && this.props.partial.has(c)) {
      return "some";
    }
    return !!this.props.selectedChoices.has(c);
  }
}

export default MultiselectFilterMenu;