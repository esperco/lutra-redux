import * as _ from "lodash";
import * as React from "react";
import * as classNames from "classnames";
import CheckboxItem from "./CheckboxItem";
import Dropdown from "./Dropdown";
import FilterInput from "./FilterInput";
import Icon from "./Icon";
import * as ApiT from "../lib/apiT";
import { colorForText } from "../lib/colors";
import {
  getLabelSelections, filterLabels, match, newLabel
} from "../lib/event-labels";
import * as LabelText from "../text/labels";

interface Props {
  labels: ApiT.LabelInfo[];
  events: ApiT.GenericCalendarEvent[];
  onChange?: (ids: string[], x: ApiT.LabelInfo, active: boolean) => void;
}

export class LabelList extends React.Component<Props, {}> {
  _dropdown: Dropdown;

  render() {
    let { labels, selections } = getLabelSelections(
      this.props.labels, this.props.events
    );
    let { onChange } = this.props;
    return <div className="label-list">
      { _.map(labels, (l) => selections[l.normalized] !== false ?
        <Label key={l.normalized} label={l}
               onClick={onChange && (() => this.change(l, false))}
        /> : null)}

      { onChange ?
        <Dropdown ref={(c) => this._dropdown = c} keepOpen={true}
          toggle={<button>
            <Icon type="add">
              { LabelText.AddLabel }
            </Icon>
          </button>}

          menu={<Menu
            { ...{labels, selections} }
            onChange={(l, v) => this.change(l, v)}
            closeFn={() => this._dropdown && this._dropdown.close()}
          />}
        /> : null }
    </div>;
  }

  change(label: ApiT.LabelInfo, active: boolean) {
    if (this.props.onChange) {
      let eventIds = _.map(this.props.events, (e) => e.id);
      this.props.onChange(eventIds, label, active);
    }
  }
}

export function Label({ label, onClick } : {
  label: ApiT.LabelInfo;
  onClick?: () => void;
}) {
  let style = {
    background: label.color,
    color: label.color ? colorForText(label.color) : undefined
  };
  return <span className="tag" style={style}>
    <span>{ label.original }</span>
    { onClick ? <button onClick={onClick}>
      <Icon type="remove" />
    </button> : null }
  </span>;
}


interface MenuProps {
  labels: ApiT.LabelInfo[];
  selections: Record<string, boolean|"some">;
  closeFn: () => void;
  onChange: (x: ApiT.LabelInfo, selected: boolean) => void;
}

interface MenuState {
  value: string;
  activeIndex: number; // -1 = new item
  visibleLabels: ApiT.LabelInfo[];
  matchingLabel?: ApiT.LabelInfo;
}

export class Menu extends React.Component<MenuProps, MenuState> {
  constructor(props: MenuProps) {
    super(props);
    this.state = {
      value: "",
      activeIndex: -1,
      visibleLabels: props.labels
    };
  }

  render() {
    return <div className="dropdown-menu label-list-menu">
      <FilterInput
        value={this.state.value}
        onChange={(value) => this.change(value)}
        onSubmit={() => this.submit()}
        onUp={() => this.prev()}
        onDown={() => this.next()}
      />
      <div className="menu">
        { this.state.value &&
          this.state.value.trim() &&
          !this.state.matchingLabel ?
          <button key={0} onClick={() => this.submit()}
            className={classNames({
              active: this.state.activeIndex === -1
            })}>
            <Icon type="add">
              { this.state.value }
            </Icon>
          </button> : null }

        { _.map(this.state.visibleLabels, (l, i) =>
          <CheckboxItem key={l.normalized}
            className={classNames({
              active: this.state.activeIndex === i
            })}
            checked={!!this.props.selections[l.normalized]}
            onChange={(val) => this.toggle(l, val)}
            background={l.color}
            color={l.color ? colorForText(l.color) : undefined}
          >
            { l.original }
          </CheckboxItem>) }
      </div>
    </div>;
  }

  change(value: string) {
    let visibleLabels = filterLabels(this.props.labels, value);
    let matchingLabel = match(visibleLabels, value);
    this.setState({
      value,
      activeIndex: matchingLabel ? 0 : -1,
      visibleLabels,
      matchingLabel
    });
  }

  toggle(label: ApiT.LabelInfo, value: boolean) {
    this.props.onChange(label, value);
    this.props.closeFn();
  }

  submit() {
    // Highlighting a label (or matching an exact one) => use that
    let index = this.state.activeIndex;
    if (_.isNumber(index) && index >= 0) {
      let selectedLabel = this.state.visibleLabels[index]
        || this.state.matchingLabel;
      if (selectedLabel) {
        this.props.onChange(
          selectedLabel,
          this.props.selections[selectedLabel.normalized] !== true
        );
      }
    }

    // Else check input field
    else {
      let value = this.state.value.trim();
      if (value) {
        this.props.onChange(newLabel(value), true);
      }
    }
  }

  prev() {
    this.setState({ ...this.state,
      activeIndex: Math.max(this.state.activeIndex - 1, -1)
    });
  }

  next() {
    this.setState({ ...this.state,
      activeIndex: Math.min(
        this.state.activeIndex + 1,
        this.state.visibleLabels.length - 1
      )
    });
  }
}

export default LabelList;