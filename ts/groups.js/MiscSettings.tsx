/*
  This is the view that displays misc settings like removing a group
*/

import * as React from 'react';
import { LoggedInState, DispatchFn } from './types';
import SettingsNav from "./SettingsNav";
import { TBSettings, TimebombSettings } from "../components/TimebombSettings";
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
    return <div className="content">
      <div className="container">
        <SettingsNav {...this.props} />
        { ready(summary) ?
          this.renderContent(summary) :
          <div className="spinner" /> }
      </div>
    </div>;
  }

  renderContent(summary: GroupSummary) {
    let name = summary.group_name;
    let tb = {
      enabled: summary.group_tb,
      minGuests: summary.group_tb_guests_min,
      maxGuests: summary.group_tb_guests_max,
      recurring: summary.group_tb_recurring,
      sameDomain: summary.group_tb_same_domain
    };
    return <div>
      <div className="panel">
        <TimebombSettings value={tb} onChange={this.setTb} />
      </div>

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

  setTb = (tb: TBSettings) => {
    Groups.patchGroupDetails(this.props.groupId, {
      group_tb: tb.enabled,
      group_tb_guests_min: tb.minGuests,
      group_tb_guests_max: tb.maxGuests,
      group_tb_recurring: tb.recurring,
      group_tb_same_domain: tb.sameDomain
    }, this.props);
  }
}

export default MiscSettings;
