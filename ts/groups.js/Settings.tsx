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
import { Menu } from '../components/Menu';
import { Dropdown } from '../components/Dropdown';
import { GroupRole } from "../lib/apiT";
import { OrderedSet } from "../lib/util";
import * as Text from "../text/groups";

class Props {
  groupId: string;
  page: SettingTypes;
  state: State;
  dispatch: DispatchFn;
}

class Settings extends React.Component<Props, {}> {
  ROLE_LIST = [{
    original: <p className="group-role">
      <span>{Text.roleDisplayName("Owner")}</span>
      <p>{Text.roleDescription("Owner")}</p>
    </p>,
    normalized: "Owner" as GroupRole
  }, {
    original: <p className="group-role">
      <span>{Text.roleDisplayName("Manager")}</span>
      <p>{Text.roleDescription("Manager")}</p>
    </p>,
    normalized: "Manager" as GroupRole
  }, {
    original: <p className="group-role">
      <span>{Text.roleDisplayName("Member")}</span>
      <p>{Text.roleDescription("Member")}</p>
    </p>,
    normalized: "Member" as GroupRole
  }];

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
      let choices = new OrderedSet(this.ROLE_LIST, (role) => role.normalized);

      return <div key={gim.uid} className="panel">
        <Icon type={associatedTeam ? "calendar-check" : "calendar-empty"}>
          { displayName }
        </Icon>
        <Dropdown
          keepOpen={true}

          toggle={<button className="group-role-badge">
            { Text.roleDisplayName(gim.role) }
            {" "}
            <Icon type="caret-down" />
          </button>}

          menu={<div className="dropdown-menu">
            <Menu choices={choices}
              selected={{original: "", normalized: gim.role}} />
          </div>}
        />
      </div>;
    });
  }
}

export default Settings;
