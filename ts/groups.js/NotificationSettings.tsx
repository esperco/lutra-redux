/*
  This is the view that display notification settings
*/

import * as React from 'react';
// import * as _ from 'lodash';
import { LoggedInState, DispatchFn } from './types';
import SettingsNav from "./SettingsNav";
import { ApiSvc } from "../lib/api";
import { NavSvc } from "../lib/routing";

interface Props {
  groupId: string;
  state: LoggedInState;
  dispatch: DispatchFn;
  Svcs: ApiSvc & NavSvc;
}

class NotificationSettings extends React.Component<Props, {}> {
  render() {
    return <div className="content">
      <div className="container">
        <SettingsNav {...this.props} />
      </div>
    </div>;
  }
}

export default NotificationSettings;
