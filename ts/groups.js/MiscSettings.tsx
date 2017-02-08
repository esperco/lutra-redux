/*
  This is the view that display misc settings like removing a group
*/

import * as React from 'react';
// import * as _ from 'lodash';
import { LoggedInState, DispatchFn } from './types';
import SettingsNav from "./SettingsNav";
import * as Groups from "../handlers/groups";
import { ApiSvc } from "../lib/api";
import { NavSvc } from "../lib/routing";
import { ready } from "../states/data-status";
import * as Text from "../text/groups";

interface Props {
  groupId: string;
  state: LoggedInState;
  dispatch: DispatchFn;
  Svcs: ApiSvc & NavSvc;
}

class MiscSettings extends React.Component<Props, {}> {
  render() {
    let summary = this.props.state.groupSummaries[this.props.groupId];
    let name = ready(summary) ? summary.group_name : undefined;
    return <div className="content">
      <div className="container">
        <SettingsNav {...this.props} />
        <div className="panel">
          <div className="alert danger">
            { Text.removeGroupDescription(name) }
          </div>
          <div>
            <button className="danger" onClick={
              () => Groups.deleteGroup(this.props.groupId, this.props)
            }>
              { Text.RemoveGroupBtn }
            </button>
          </div>
        </div>
      </div>
    </div>;
  }

}

export default MiscSettings;
