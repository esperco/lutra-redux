/*
  Component for selecting from a list of options with a text input to
  filter options
*/

import * as _ from "lodash";
import * as React from 'react';
import * as classNames from "classnames";
import FilterInput from "./FilterInput";
import { Choice, Menu, Props as MenuProps } from "./Menu";
import Icon from "./Icon";


export interface Props extends MenuProps {
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

export interface State {
  value: string;       // Of FilterInput
  activeIndex: number; // -1 = select nothing
  visibleChoices: Choice[];
  visibleAdd: boolean;
  visibleSpecialChoices: boolean;
}

export class FilterMenu<P extends Props> extends Menu<P> {
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
      visibleAdd: !!value.trim() && !exactMatch
    });
  }
}

export default FilterMenu;
