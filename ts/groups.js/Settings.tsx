/*
  This is the main view for the group page
*/

import * as React from 'react';
import { State, DispatchFn } from './types';
import { SettingTypes } from './routes';
import SettingsNav from './SettingsNav';

class Props {
  groupId: string;
  page: SettingTypes;
  state: State;
  dispatch: DispatchFn;
}

class Settings extends React.Component<Props, {}> {
  render() {
    return <div>
      <SettingsNav {...this.props} />
      Settings page
    </div>;
  }
}

export default Settings;
