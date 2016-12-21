/*
  Variant of DelayedInput with search icon and whatnot
*/

import * as React from "react";
import { default as DelayedInput, Props } from "./DelayedInput";
import Icon from "./Icon";
import { randomString } from "../lib/util";

export class SearchInput extends React.Component<Props, {}> {
  render() {
    let id = randomString();
    return <div className="search-input input-row">
      <label htmlFor={this.props.id}>
        <Icon type="search" />
      </label>

      <div className="has-right-icon">
        <DelayedInput {...this.props} id={id} />
        { this.props.value ? <button className="clear-input"
                onClick={() => this.props.onUpdate("")}>
          <Icon type="clear" />
        </button> : null }
      </div>
    </div>;
  }
}

export default SearchInput;