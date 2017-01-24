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
import { Menu, Choice } from '../components/Menu';
import TimezoneSelector, { toZoneName } from '../components/TimezoneSelector';
import { Dropdown } from '../components/Dropdown';
import { GroupRole } from "../lib/apiT";
import { ApiSvc } from "../lib/api";
import { OrderedSet } from "../lib/util";
import { Zones } from "../lib/timezones";
import * as Text from "../text/groups";

class Props {
  groupId: string;
  page: SettingTypes;
  state: State;
  dispatch: DispatchFn;
  Svcs: ApiSvc;
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
    let { groupId, state, dispatch, Svcs } = this.props;
    let groupSummary = state.groupSummaries[groupId];
    let groupMembers = state.groupMembers[groupId];

    if (groupSummary === "FETCH_ERROR" || groupSummary === undefined) {
      dispatch({
        type: "ROUTE",
        route: { page: "NotFound" }
      });
    }

    if (groupSummary === "FETCHING") {
      return <div className="spinner" />;
    }

    if (ready(groupSummary)) {
      let content: JSX.Element;
      switch (this.props.page) {
        case "GeneralSettings":
          let groupTimezone = groupSummary.group_timezone;
          let timezone =
            _.find(Zones, (z) => z.id === groupTimezone);
          let onSelect = (choice: Choice, _: "enter"|"click") => {
            let group_timezone = toZoneName(choice).id;
            Svcs.Api.putGroupTimezone(groupId, group_timezone).then(() =>
              dispatch({
                type: "GROUP_UPDATE",
                groupId,
                summary: {
                  group_timezone
                }
              })
            );
          };
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
                <Dropdown
                  toggle={<input type="text" readOnly
                    value={timezone ? timezone.display : ""} />}

                  menu={<div className="dropdown-menu">
                    <TimezoneSelector
                      selected={groupSummary.group_timezone}
                      onSelect={onSelect} />
                  </div>}
                />
              </div>
            </div>
            <div className="panel">
              { ready(groupMembers) ?
                  this.renderMembers(groupMembers, groupId, {dispatch, Svcs})
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

  renderMembers(list: GroupMembers, groupId: string, deps: {
    dispatch: DispatchFn,
    Svcs: ApiSvc
  }) {
    let { dispatch, Svcs } = deps;
    return _.map(list.group_individuals, (gim, i) => {
      // Don't render this individual if its UID does not exist
      if (!gim.uid) return;
      let uid = gim.uid;
      let associatedTeam =
        _.find(list.group_teams, (m) => m.email === gim.email);
      let displayName = associatedTeam ? associatedTeam.name : gim.email;
      let choices = new OrderedSet(this.ROLE_LIST, (role) => role.normalized);

      let onSelect = (choice: Choice, _method: "click"|"enter") => {
        Svcs.Api.putGroupIndividual(groupId, uid, {role: choice.normalized})
            .then(() => {
              let group_individuals = _.cloneDeep(list.group_individuals);
              let ind = _.find(group_individuals, (i) => i.uid === uid);
              ind ? ind.role = choice.normalized as GroupRole : null;
              dispatch({
                type: "GROUP_UPDATE",
                groupId,
                members: { group_individuals }
              });
            });
      };

      return <div key={gim.uid} className="panel">
        <Icon type={associatedTeam ? "calendar-check" : "calendar-empty"}>
          { displayName }
        </Icon>
        <Dropdown
          toggle={<button className="group-role-badge">
            { Text.roleDisplayName(gim.role) }
            {" "}
            <Icon type="caret-down" />
          </button>}

          menu={<div className="dropdown-menu">
            <Menu choices={choices}
              onSelect={onSelect}
              selected={{original: "", normalized: gim.role}} />
          </div>}
        />
      </div>;
    });
  }
}

export default Settings;
