/*
  This is the view that display notification settings
*/

import * as React from 'react';
import { LoggedInState, DispatchFn } from './types';
import SettingsNav from "./SettingsNav";
import CheckboxItem from "../components/CheckboxItem";
import * as Groups from "../handlers/groups";
import { ApiSvc } from "../lib/api";
import { NavSvc } from "../lib/routing";
import { ready } from "../states/data-status";
import { GroupPreferences } from "../states/groups";
import * as Text from "../text/groups";

interface Props {
  groupId: string;
  state: LoggedInState;
  dispatch: DispatchFn;
  Svcs: ApiSvc & NavSvc;
}

class NotificationSettings extends React.Component<Props, {}> {
  render() {
    let prefs = this.props.state.groupPreferences[this.props.groupId];
    return <div className="content">
      <div className="container">
        <SettingsNav {...this.props} />
        { ready(prefs) ?
          <div className="panel">
            <div className="alert info">
              { Text.alertsGoTo(this.props.state.login.email) }
            </div>
            <div className="menu">
              <DailyEmail {...this.props} prefs={prefs} />
            </div>
          </div> :
          <div className="spinner" />
        }
      </div>
    </div>;
  }
}

interface Subprops extends Props {
  prefs: GroupPreferences;
}

class DailyEmail extends React.Component<Subprops, {}> {
  render() {
    return <CheckboxItem
      checked={!!this.props.prefs.daily_breakdown}
      onChange={this.change}>
        { Text.DailyEmail }
    </CheckboxItem>
  }

  change = (val: boolean) => {
    Groups.updateDailyEmail(this.props.groupId, val, this.props);
  }
}


export default NotificationSettings;
