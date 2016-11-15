/*
  This is the main view for the group page
*/

import * as React from 'react';
import { State, DispatchFn } from './types';
import GroupNav from "./GroupNav";

class Props {
  state: State;
  dispatch: DispatchFn;
}

class Setup extends React.Component<Props, {}> {
  render() {
    return <div>
      <GroupNav />
      Setup page
    </div>;
  }
}

export default Setup;
