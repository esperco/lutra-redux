/*
  Component for selecting from a list of options with a text input to
  filter options
*/

import * as _ from "lodash";
import * as React from 'react';
import * as classNames from "classnames";
import FilterInput from "./FilterInput";
import Icon from "./Icon";
import { Choice } from "./Menu";
import RadioItem from "./RadioItem";
import { colorForText } from "../lib/colors";
import { OrderedSet, randomString } from "../lib/util";

// Like choice, but these don't get filtered
export interface SpecialChoice {
  displayAs: string|JSX.Element;
  onSelect: (newVal: boolean, method: "click"|"enter") => void;
  selected?: boolean;
  color?: string;
}

export interface BaseProps {
  // All choices
  choices: OrderedSet<Choice>;

  // Typing in something new and submitting it
  onAdd?: (text: string, method: "click"|"enter") => void;

  specialChoices?: SpecialChoice[];

  /*
    Filter function to use -- defaults to including trim plus lower-case of
    normalized text. Should return 2-tuple of filtered choices. First item
    is tuple is the
  */
  filterFn: (text: string) => [
    Choice|undefined,   // Exact match?
    Choice[]            // Remainder
  ];
}

export interface Props extends BaseProps {
  // Selected choice
  selected?: Choice;

  onSelect: (choice: Choice, method: "click"|"enter") => void;
}

export interface State {
  value: string;       // Of FilterInput
  activeIndex: number; // -1 = select nothing
  visibleChoices: Choice[];
  visibleAdd: boolean;
  visibleSpecialChoices: boolean;
}

// Base class for both FilterMenu and MultiselectFilterMenu
export abstract class FilterMenuBase<P extends BaseProps>
       extends React.Component<P, State>
{
  constructor(props: P) {
    super(props);
    this.state = this.resetState(props);
  }

  resetState(props: P): State {
    return {
      value: "",
      activeIndex: -1,
      visibleChoices: props.choices.toList(),
      visibleSpecialChoices: !!props.specialChoices,
      visibleAdd: false
    };
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
            this.renderSpecialChoice(c, i,
              this.state.activeIndex === specialIndexIncr + i
            )
          ) }
        </div> : null }

      { _.isEmpty(this.state.visibleChoices) ? null :
        <div className="menu">
          { _.map(this.state.visibleChoices, (c, i) =>
            this.renderChoice(c, i,
              this.state.activeIndex === indexIncr + i
            )
          ) }
        </div> }
    </div>;
  }

  abstract renderSpecialChoice(
    c: SpecialChoice,
    index: number,
    isActive: boolean
  ): JSX.Element;

  abstract renderChoice(
    c: Choice,
    index: number,
    isActive: boolean
  ): JSX.Element;

  change(value: string) {
    let [exactMatch, visibleChoices] = this.props.filterFn(value);
    if (exactMatch) {
      visibleChoices = [exactMatch].concat(visibleChoices);
    }
    this.setState({
      value,
      activeIndex: !!value.trim() ? 0 : -1,
      visibleChoices,
      visibleSpecialChoices: !value,
      visibleAdd: !!this.props.onAdd && !!value.trim() && !exactMatch
    });
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

  submit(method: "enter"|"click" = "enter") {
    let didAdd = (() => {
      let index = this.state.activeIndex;
      if (this.state.visibleAdd && this.props.onAdd) {
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
        this.selectChoice(choice, method);
      }

      return false;
    })();

    // Reset state only if adding a label
    if (didAdd) {
      this.setState(this.resetState(this.props));
    }

    this.setState(this.resetState(this.props));
  }

  abstract selectChoice(choice: Choice, method: "enter"|"click"): void;
}


export class FilterMenu extends FilterMenuBase<Props> {
  name: string;

  constructor(props: Props) {
    super(props);
    this.name = randomString();
  }

  renderSpecialChoice(
    c: SpecialChoice,
    index: number,
    isActive: boolean
  ): JSX.Element {
    return <RadioItem key={index}
        name={this.name}
        checked={c.selected}
        className={isActive ? "active" : ""}
        onChange={(v) => c.onSelect(v, "click")}
        background={c.color}
        color={c.color ? colorForText(c.color) : undefined}>
      { c.displayAs }
    </RadioItem>;
  }

  renderChoice(c: Choice, index: number, isActive: boolean): JSX.Element {
    return <RadioItem key={c.normalized}
        name={this.name}
        checked={!!this.props.selected &&
                 this.props.selected.normalized === c.normalized}
        className={isActive ? "active" : ""}
        onChange={(v) => v && this.selectChoice(c, "click")}
        background={c.color}
        color={c.color ? colorForText(c.color) : undefined}>
      { c.original }
    </RadioItem>;
  }

  selectChoice(choice: Choice, method: "enter"|"click") {
    this.props.onSelect(choice, method);
    this.setState(this.resetState(this.props));
  }
}

export default FilterMenu;
