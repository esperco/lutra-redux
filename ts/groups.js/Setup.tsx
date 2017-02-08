/*
  This is the new-group / onboarding page
*/

import * as React from 'react';
import { State, DispatchFn } from './types';
import * as Text from "../text/groups";

class Props {
  state: State;
  dispatch: DispatchFn;
}

class Setup extends React.Component<Props, {}> {
  render() {
    return <div id="group-onboarding" className="container">
      <h2>{ Text.GroupOnboardingHeader }</h2>
      { Text.GroupOnboardingDescription }
      <div>
        <button className="primary">
          { Text.GroupOnboardingStart }
        </button>
      </div>
    </div>;
  }
}

export default Setup;
