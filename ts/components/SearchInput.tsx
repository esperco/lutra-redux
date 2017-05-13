/*
  Variant of TextInput with search icon and whatnot
*/

import * as React from "react";
import { default as TextInput, Props } from "./TextInput";
import Icon from "./Icon";
import { randomString } from "../lib/util";

export class SearchInput extends React.Component<Props, {}> {
  render() {
    let id = randomString();
    return <div className="search-input input-row">
      <div className="has-right-icon">
        <TextInput {...this.props} id={id} />
        { this.props.value ? <button className="clear-input"
                onClick={() => this.props.onChange("")}>
          <Icon type="clear" />
        </button> : null }
      </div>
    </div>;
  }
}

export default SearchInput;