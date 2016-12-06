import * as React from "react";
import * as _ from "lodash";
import { DataState } from "../states/data-status";
import { Loading, Saving } from "../text/data-status";

class DataStatus extends React.Component<DataState, {}> {
  render() {
    let { apiCalls } = this.props;
    if (_.isEmpty(apiCalls)) {
      return null;
    }

    return <div className="data-status">
      <span className="spinner" />
      <span>
        { _.some(apiCalls) ? Saving : Loading }
      </span>
    </div>;
  }
}

export default DataStatus;