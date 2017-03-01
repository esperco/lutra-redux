/*
  This is the view that displays misc settings like removing a group
*/

import * as React from 'react';
import { LoggedInState, DispatchFn } from './types';
import SettingsNav from "./SettingsNav";
import { CheckboxItem } from "../components/CheckboxItem";
import * as Groups from "../handlers/groups";
import { ApiSvc } from "../lib/api";
import { NavSvc } from "../lib/routing";
import { ready } from "../states/data-status";
import { GroupSummary } from "../states/groups";
import { AlphaModeMsg } from "../text/common";
import * as Text from "../text/groups";
import * as TBText from "../text/timebomb";

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
    let tbEnabled = summary.group_tb;
    let tbMinGuests = summary.group_tb_guests_min;
    let tbMaxGuests = summary.group_tb_guests_max;
    return <div>
      <div className="panel">
        <div className="alert info">
          { AlphaModeMsg }
        </div>
        <CheckboxItem checked={tbEnabled}
                      onChange={(val) => this.setTimebomb(val)}>
          { TBText.TimebombEnable }
          <div className="description">
            { TBText.TimebombDescribe }
          </div>
        </CheckboxItem>
        <div className="form-row">
          <label htmlFor="tb-min-guests">
            { TBText.TimebombMinGuests }
          </label>
          <input id="tb-min-guests" type="number" value={tbMinGuests}
                  min="0" onChange={(e) => this.setTimebombMinGuests(e)} />
        </div>
        <div className="form-row">
          <label htmlFor="tb-max-guests">
            { TBText.TimebombMaxGuests }
          </label>
          <input id="tb-max-guests" type="number" value={tbMaxGuests}
                  min="0" onChange={(e) => this.setTimebombMaxGuests(e)} />
        </div>
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

  setTimebomb(val: boolean) {
    Groups.patchGroupDetails({
      groupId: this.props.groupId,
      group_tb: val
    }, this.props);
  }

  setTimebombMinGuests(event: React.FormEvent<HTMLInputElement>) {
    let min = Number.parseInt(event.currentTarget.value);
    Groups.setTimebombMinGuests(this.props.groupId, min, this.props);
  }

  setTimebombMaxGuests(event: React.FormEvent<HTMLInputElement>) {
    let max = Number.parseInt(event.currentTarget.value);
    Groups.setTimebombMaxGuests(this.props.groupId, max, this.props);
  }
}

export default MiscSettings;
