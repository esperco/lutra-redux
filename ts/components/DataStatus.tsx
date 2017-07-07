/*
  Show status of API calls
*/

require("less/components/_data-status.less");
import * as React from "react";
import { some } from "lodash";
import { DataState } from "../states/data-status";
import { Loading, Saving } from "../text/data-status";

class DataStatus extends React.Component<DataState, {}> {
  render() {
    let { apiCalls } = this.props;
    if (! Object.keys(apiCalls).length) {
      return null;
    }

    return <div className="data-status">
      <span className="spinner" />
      <span>
        { some(apiCalls) ? Saving : Loading }
      </span>
    </div>;
  }
}

export default DataStatus;