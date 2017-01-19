/*
  This is the main view for the group page
*/

import * as React from 'react';
import * as _ from 'lodash';
import { State, DispatchFn } from './types';
import { SettingTypes } from './routes';
import { ready } from '../states/data-status';
import { GroupMembers } from '../states/groups';
import SettingsNav from './SettingsNav';
import Icon from '../components/Icon';

class Props {
  groupId: string;
  page: SettingTypes;
  state: State;
  dispatch: DispatchFn;
}

class Settings extends React.Component<Props, {}> {
  render() {
    let { groupId, state, dispatch } = this.props;
    let groupSummary = state.groupSummaries[groupId];
    let groupMembers = state.groupMembers[groupId];

    if (groupSummary === "FETCH_ERROR" || groupSummary === undefined) {
      dispatch({
        type: "ROUTE",
        route: { page: "NotFound" }
      });
    }

    if (groupSummary === "FETCHING") {
      return <div className="loading-msg" />;
    }

    if (ready(groupSummary)) {
      let content: JSX.Element;
      switch (this.props.page) {
        case "GeneralSettings":
          content = <div className="container">
            <div className="panel">
              <div className="input-row">
                <label htmlFor="group-name">
                  Group Name
                </label>
                <input id="group-name" name="group-name"
                  type="text"
                  defaultValue={groupSummary.group_name}
                  placeholder="The Avengers" />
              </div>
              <div className="input-row">
                <label htmlFor="group-timezone">
                  Timezone
                </label>
                <input id="group-timezone" name="group-timezone"
                  type="text"
                  defaultValue={groupSummary.group_timezone}
                  placeholder="The Avengers" />
              </div>
            </div>
            <div className="panel">
              { ready(groupMembers) ? this.renderMembers(groupMembers)
                  : <div className="loading-msg" />
              }
            </div>
          </div>;
          break;
        default:
          content = <div />;
          break;
      }

      return <div>
        <SettingsNav {...this.props} />
        <div className="content">
          { content }
        </div>
      </div>;
    }
    return <div className="no-content" />;
  }

  renderMembers(list: GroupMembers) {
    return _.map(list.group_individuals, (gim) => {
      let associatedTeam =
        _.find(list.group_teams, (m) => m.email === gim.email);
      let displayName = associatedTeam ? associatedTeam.name : gim.email;

      return <div key={gim.uid} className="panel">
        <Icon type={associatedTeam ? "calendar-check" : "calendar-empty"}>
          { displayName }
        </Icon>
      </div>;
    });
  }
}

export default Settings;
