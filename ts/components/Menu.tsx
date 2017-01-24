/*
  Component for selecting from a list of options
*/

import * as _ from "lodash";
import * as React from 'react';
import * as classNames from "classnames";
import RadioItem from "./RadioItem";
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

  // Selected choice
  selected?: Choice;

  // Selecting an existing choice
  onSelect?: (choice: Choice, method: "click"|"enter") => void;

  specialChoices?: SpecialChoice[];
}

export interface State {
  value: string;       // Of FilterInput
  activeIndex: number; // -1 = select nothing
  visibleChoices: Choice[];
  visibleAdd: boolean;
  visibleSpecialChoices: boolean;
}

export class Menu<P extends Props> extends React.Component<P, State> {
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
            this.renderListItem({
              key: i.toString(),
              classNames: classNames({
                active: this.state.activeIndex === specialIndexIncr + i
              }),
              selected: !!c.selected,
              onSelect: (val) => c.onSelect(val, "click"),
              color: c.color,
              content: c.displayAs
            })
          )}
        </div> : null }

      { _.isEmpty(this.state.visibleChoices) ? null :
        <div className="menu">
          { _.map(this.state.visibleChoices, (c, i) =>
            this.renderListItem({
              key: c.normalized,
              classNames: classNames({
                active: this.state.activeIndex === indexIncr + i
              }),
              selected: !!this.props.selected &&
                        this.props.selected.normalized === c.normalized,
              onSelect: (val) => this.select(c, val),
              color: c.color,
              content: c.original
            })) }
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
    return <RadioItem key={props.key}
        name={props.key}
        className={props.classNames}
        checked={props.selected}
        onChange={props.onSelect}
        background={props.color}
        color={props.color ? colorForText(props.color) : undefined}>
      { props.content }
    </RadioItem>;
  }

  submit(method: "enter"|"click" = "enter") {
    (() => {
      let index = this.state.activeIndex;
      if (this.state.visibleAdd) {
        if (index === 0) {
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
      if (choice && this.props.onSelect) {
        this.props.onSelect(
          choice,
          method
        );
        return;
      }
    })();

    this.setState(this.resetState(this.props));
  }

  select(choice: Choice, val: boolean) {
    if (this.props.onSelect) {
      this.props.onSelect(
        choice,
        "click"
      );
      this.setState(this.resetState(this.props));
    }
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

export default Menu;