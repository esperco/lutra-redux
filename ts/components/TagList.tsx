/*
  Shows a list of tags that we can add and remove from
*/

import * as React from 'react';
import * as classNames from 'classnames';
import Dropdown from "./Dropdown";
import { Props as MenuProps, Choice, FilterMenu } from './FilterMenu';
import Icon from "./Icon";
import { colorForText } from "../lib/colors";

interface Props extends MenuProps {
  buttonText: string|JSX.Element;
  onClose?: () => void;      // On dropdown close
  tagHrefFn?: (c: Choice) => string;
}

export class TagList extends React.Component<Props, {}> {
  _dropdown: Dropdown;

  render() {
    return <div className="tag-list">
      { this.renderTags() }
      { this.renderDropdown() }
    </div>;
  }

  renderTags() {
    return this.props.selected.map((c) =>
      <span key={c.normalized} className={classNames("tag", {
        partial: this.props.partial && this.props.partial.has(c)
      })} style={{
        background: c.color,
        color: c.color ? colorForText(c.color) : undefined
      }}>
        { this.props.tagHrefFn ?
          <a href={this.props.tagHrefFn(c)}>{ c.original }</a> :
          <span>{ c.original }</span> }
        <button onClick={() => this.props.onToggle(c, false, "click")}>
          <Icon type="remove" />
        </button>
      </span>);
  }

  renderDropdown() {
    return <Dropdown ref={(c) => this._dropdown = c}
      keepOpen={true}
      onClose={this.props.onClose}

      toggle={<button>
        { this.props.buttonText }
      </button>}

      menu={<div className="dropdown-menu tag-list-menu">
        <FilterMenu { ...this.props } />
      </div>}
    />
  }

  close() {
    if (this._dropdown) {
      this._dropdown.close();
    }
  }
}

export default TagList;