/*
  Component for selecting multiple items from a list of options with a
  text input to filter options
*/

import * as _ from "lodash";
import * as React from 'react';
import * as classNames from "classnames";
import CheckboxItem from "./CheckboxItem";
import FilterInput from "./FilterInput";
import { Choice } from "./Menu";
import { Props as BaseProps, FilterMenu } from "./FilterMenu";
import Icon from "./Icon";
import { colorForText } from "../lib/colors";
import { OrderedSet } from "../lib/util";


// Like choice, but these don't get filtered
export interface SpecialChoice {
  displayAs: string|JSX.Element;
  onSelect: (newVal: boolean, method: "click"|"enter") => void;
  selected?: boolean;
  color?: string;
}

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

  // Typing in something new and hitting enter
  onAdd: (text: string, method: "click"|"enter") => void;
}

export interface State {
  value: string;       // Of FilterInput
  activeIndex: number; // -1 = select nothing
  visibleChoices: Choice[];
  visibleAdd: boolean;
  visibleSpecialChoices: boolean;
}

export class MultiselectFilterMenu extends FilterMenu<Props> {
  constructor(props: Props) {
    super(props);
    this.state = this.resetState(props);
  }

  render() {
    // Incr values are used to determine whether an item is highlighted
    // because of this.state.activeIndex
    let specialIndexIncr = 0;
    let indexIncr = 0;
    if (this.state.visibleAdd) {
      specialIndexIncr += 1;
      indexIncr += 1;
    }
    if (this.state.visibleSpecialChoices) {
      indexIncr += (this.props.specialChoices || []).length;
    }

    return <div>
      <FilterInput
        value={this.state.value}
        onChange={(value) => this.change(value)}
        onSubmit={() => this.submit()}
        onUp={() => this.prev()}
        onDown={() => this.next()}
      />

      { this.state.visibleAdd ? <div className="menu">
        <button onClick={() => this.submit("click")}
          className={classNames({
            active: this.state.activeIndex === 0
          })}>
          <Icon type="add">
            { this.state.value }
          </Icon>
        </button>
      </div> : null }

      { this.state.visibleSpecialChoices && this.props.specialChoices ?
        <div className="menu">
          { _.map(this.props.specialChoices, (c, i) =>
            <CheckboxItem key={i}
              className={classNames({
                active: this.state.activeIndex === specialIndexIncr + i,
              })}
              checked={!!c.selected}
              onChange={(val) => c.onSelect(val, "click")}
              background={c.color}
              color={c.color ? colorForText(c.color) : undefined}
            >
              { c.displayAs }
            </CheckboxItem>
          )}
        </div> : null }

      { _.isEmpty(this.state.visibleChoices) ? null :
        <div className="menu">
          { _.map(this.state.visibleChoices, (c, i) =>
            <CheckboxItem key={c.normalized}
              className={classNames({
                active: this.state.activeIndex === indexIncr + i,
                partial: this.selectStatus(c) === "some"
              })}
              checked={this.selectStatus(c) !== false}
              onChange={(val) => this.toggle(c, val)}
              background={c.color}
              color={c.color ? colorForText(c.color) : undefined}
            >
              { c.original }
            </CheckboxItem>) }
        </div> }
    </div>;
  }

  renderListItem(props: {
    key: string;
    classNames: string;
    selected: boolean;
    onSelect: (val: boolean) => void;
    color: string|undefined;
    content: string|JSX.Element;
  }) {
    return <CheckboxItem key={props.key}
        className={props.classNames}
        checked={props.selected}
        onChange={props.onSelect}
        background={props.color}
        color={props.color ? colorForText(props.color) : undefined}>
      { props.content }
    </CheckboxItem>;
  }

  selectStatus(c: Choice): boolean|"some" {
    if (this.props.partial && this.props.partial.has(c)) {
      return "some";
    }
    return !!this.props.selectedChoices.has(c);
  }

  submit(method: "enter"|"click" = "enter") {
    let didAdd = (() => {
      let index = this.state.activeIndex;
      if (this.state.visibleAdd) {
        if (index === 0) {
          this.props.onAdd(this.state.value, method);
          return true;
        }
        index -= 1;
      }

      if (this.state.visibleSpecialChoices && this.props.specialChoices) {
        let specialChoice = this.props.specialChoices[index];
        if (specialChoice) {
          specialChoice.onSelect(!specialChoice.selected, method);
          return false;
        }
        index -= this.props.specialChoices.length;
      }

      let choice = this.state.visibleChoices[index];
      if (choice) {
        this.props.onToggle(
          choice,
          this.selectStatus(choice) !== true,
          method
        );
        return false;
      }
      return false;
    })();

    // Reset state only if adding a label
    if (didAdd) {
      this.setState(this.resetState(this.props));
    }
  }

  toggle(choice: Choice, val: boolean) {
    this.props.onToggle(
      choice,
      this.selectStatus(choice) !== true,
      "click"
    );
    this.setState(this.resetState(this.props));
  }
}

export default MultiselectFilterMenu;