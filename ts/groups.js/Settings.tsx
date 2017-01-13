/*
  This is the main view for the group page
*/

import * as React from 'react';
import { State, DispatchFn } from './types';

class Props {
  groupId: string;
  state: State;
  dispatch: DispatchFn;
}

class Settings extends React.Component<Props, {}> {
  render() {
    return <div>
      Settings page
    </div>;
  }
}

export default Settings;
