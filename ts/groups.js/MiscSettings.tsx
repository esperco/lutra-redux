/*
  This is the view that displays misc settings like removing a group
*/

import * as React from 'react';
import { LoggedInState, DispatchFn } from './types';
import SettingsNav from "./SettingsNav";
import * as Groups from "../handlers/groups";
import { ApiSvc } from "../lib/api";
import { NavSvc } from "../lib/routing";
import { ready } from "../states/data-status";
import { GroupSummary } from "../states/groups";
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
    let { Svcs, ...settingsProps } = this.props;
    return <div className="content">
      <div className="container">
        <SettingsNav {...settingsProps} />
        { ready(summary) ?
          this.renderContent(summary) :
          <div className="spinner" /> }
      </div>
    </div>;
  }

  renderContent(summary: GroupSummary) {
    let name = summary.group_name;
    return <div>
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
    </div>;
  }
}

export default MiscSettings;
