/*
  Component for selecting from a list of options with a text input to
  filter options
*/

import * as _ from "lodash";
import * as React from 'react';
import * as classNames from "classnames";
import CheckboxItem from "./CheckboxItem";
import FilterInput from "./FilterInput";
import Icon from "./Icon";
import { colorForText } from "../lib/colors";
import { OrderedSet } from "../lib/util";


export interface Choice {
  // Content will also be wrapped inside checkbox label
  original: string|JSX.Element;

  // Normalized choices -- menu filters after normalization
  normalized: string;

  // If color, used as background for tag and checkbox color for list
  color?: string;
}

// Like choice, but these don't get filtered
export interface SpecialChoice {
  displayAs: string|JSX.Element;
  onSelect: (newVal: boolean, method: "click"|"enter") => void;
  selected?: boolean;
  color?: string;
}

export interface Props {
  // All choices
  choices: OrderedSet<Choice>;

  // Selected choices
  selected: OrderedSet<Choice>;

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

  // Filter function to use -- defaults to including trim plus lower-case of
  // normalized text
  filterFn?: (c: Choice, text: string) => boolean;

  // Function that returns true if string matches choice exactly -- defaults
  // to matching trim-plus-lower case of normalized text exactly
  matchFn?: (c: Choice, text: string) => boolean;

  specialChoices?: SpecialChoice[];
}

export interface State {
  value: string;       // Of FilterInput
  activeIndex: number; // -1 = select nothing
  visibleChoices: Choice[];
  visibleAdd: boolean;
  visibleSpecialChoices: boolean;
}

export class FilterMenu extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = this.resetState(props);
  }

  resetState(props: Props): State {
    return {
      value: "",
      activeIndex: -1,
      visibleChoices: props.choices.toList(),
      visibleSpecialChoices: !!props.specialChoices,
      visibleAdd: false
    };
  }

  filter(c: Choice, text: string) {
    return this.props.filterFn ?
      this.props.filterFn(c, text) :
      _.includes(c.normalized, text.trim().toLowerCase());
  }

  match(c: Choice, text: string) {
    return this.props.matchFn ?
      this.props.matchFn(c, text) :
      c.normalized === text.trim().toLowerCase();
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
          )
        }</div> : null }

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

  selectStatus(c: Choice): boolean|"some" {
    if (this.props.partial && this.props.partial.has(c)) {
      return "some";
    }
    return !!this.props.selected.has(c);
  }

  change(value: string) {
    let visibleChoices = this.props.choices.filter(
      (c) => this.filter(c, value)
    );
    let exactMatch = !!_.find(visibleChoices, (c) => this.match(c, value));

    this.setState({
      value,
      activeIndex: !!value.trim() ? 0 : -1,
      visibleChoices,
      visibleSpecialChoices: !value,
      visibleAdd: !!value.trim() && !exactMatch
    });
  }

  submit(method: "enter"|"click" = "enter") {
    (() => {
      let index = this.state.activeIndex;
      if (this.state.visibleAdd) {
        if (index === 0) {
          this.props.onAdd(this.state.value, method);
          return;
        }
        index -= 1;
      }

      if (this.state.visibleSpecialChoices && this.props.specialChoices) {
        let specialChoice = this.props.specialChoices[index];
        if (specialChoice) {
          specialChoice.onSelect(!specialChoice.selected, method);
          return;
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
        return;
      }
    })();

    this.setState(this.resetState(this.props));
  }

  toggle(choice: Choice, val: boolean) {
    this.props.onToggle(
      choice,
      this.selectStatus(choice) !== true,
      "click"
    );
    this.setState(this.resetState(this.props));
  }

  prev() {
    let min = this.state.visibleAdd ? 0 : -1;
    this.setState({ ...this.state,
      activeIndex: Math.max(this.state.activeIndex - 1, min)
    });
  }

  next() {
    let maxLength = this.state.visibleChoices.length;
    if (this.state.visibleSpecialChoices && this.props.specialChoices) {
      maxLength += this.props.specialChoices.length;
    }
    if (this.state.visibleAdd) {
      maxLength += 1;
    }
    this.setState({ ...this.state,
      activeIndex: Math.min(
        this.state.activeIndex + 1,
        maxLength - 1
      )
    });
  }
}

export default FilterMenu;