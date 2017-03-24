/*
  This is the new-group / onboarding page
*/

require("less/components/_group-onboarding.less");
import * as React from 'react';
import { makeNewGroup } from "../handlers/groups";
import { ApiSvc } from "../lib/api";
import { NavSvc } from "../lib/routing";
import * as Paths from "./paths";
import { LoggedInState, DispatchFn } from './types';
import * as Text from "../text/groups";

class Props {
  state: LoggedInState;
  dispatch: DispatchFn;
  Svcs: ApiSvc & NavSvc;
}

class Setup extends React.Component<Props, {}> {
  render() {
    return <div id="group-onboarding" className="container">
      <h2>{ Text.GroupOnboardingHeader }</h2>
      { Text.GroupOnboardingDescription }

      <div className="onboarding-start-row">
        <button className="primary" onClick={this.start}>
          { Text.GroupOnboardingStart }
        </button>
      </div>
    </div>;
  }

  start = () => {
    makeNewGroup(
      (groupId) => Paths.generalSettings.href({
        groupId, onboarding: true
      }),
      this.props
    );
  }
}

export default Setup;
