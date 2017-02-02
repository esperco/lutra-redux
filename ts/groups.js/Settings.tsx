/*
  This is the main view for the settings page
*/

import * as classNames from 'classnames';
import * as React from 'react';
import * as _ from 'lodash';
import { State, DispatchFn } from './types';
import { SettingTypes } from './routes';
import { ready, StoreData } from '../states/data-status';
import {
  fetchAvailableCalendars, fetchSelectedCalendars, updateSelectedCalendars
} from '../handlers/team-cals';
import { renameGroup, removeGroupIndividual } from '../handlers/groups';
import { GroupMembers } from '../states/groups';
import delay from '../components/DelayedControl';
import Icon from '../components/Icon';
import { Menu, Choice } from '../components/Menu';
import TextInput from "../components/TextInput";
import TimezoneSelector, { toZoneName } from '../components/TimezoneSelector';
import Tooltip from '../components/Tooltip';
import { Dropdown } from '../components/Dropdown';
import { Modal } from '../components/Modal';
import { GenericCalendar, GroupRole, GroupIndividual } from "../lib/apiT";
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
                summary: { group_timezone }
              })
            );
          };

          let selfGIM: GroupIndividual|undefined;
          let isSuper = false;
          if (ready(groupMembers)) {
            selfGIM = _.find(groupMembers.group_individuals, (gim) =>
              state.login ?
                gim.email === state.login.email || gim.uid === state.login.uid
                : undefined
            );
            isSuper = state.loggedInAsAdmin ||
              (selfGIM ? selfGIM.role === "Owner" : false);
          }

          content = <div className="container">
            <div className="panel">
              <div className="form-row">
                <label htmlFor="group-name">
                  Group Name
                </label>
                { delay({
                  value: groupSummary.group_name,
                  onChange: (value: string) =>
                    renameGroup(groupId, value, this.props),
                  component: (props) => <TextInput
                    { ...props}
                    id="group-name"
                    placeholder="The Avengers"
                    disabled={!isSuper}
                  />
                }) }
              </div>
              <div className="form-row">
                <label htmlFor="group-timezone">
                  Timezone
                </label>
                { isSuper ?
                    <Dropdown
                      toggle={<input type="text" readOnly
                        value={timezone ? timezone.display : ""} />}

                      menu={<div className="dropdown-menu">
                        <TimezoneSelector
                          selected={groupSummary.group_timezone}
                          onSelect={onSelect} />
                      </div>}
                    /> :
                    <input type="text" readOnly disabled
                           value={timezone ? timezone.display : ""} />
                }
              </div>
            </div>
            { ready(groupMembers) ?
                <GroupMembersInfo list={groupMembers} groupId={groupId}
                  selfGIM={selfGIM} isSuper={!!isSuper} {...this.props} />
                : <div className="spinner" />
            }
          </div>;
          break;
        default:
          content = <div />;
          break;
      }

      return <div>
        <div className="content">
          { content }
        </div>
      </div>;
    }
    return <div className="no-content" />;
  }
}

interface MemberProps {
  list: GroupMembers;
  groupId: string;
  selfGIM: GroupIndividual | undefined;
  isSuper: boolean;
  dispatch: DispatchFn;
  state: State;
  Svcs: ApiSvc;
}

class GroupMembersInfo extends React.Component<MemberProps, {open: string;}> {
  ROLE_LIST = [{
    original: <div className="group-role">
      <span>{Text.roleDisplayName("Owner")}</span>
      <p>{Text.roleDescription("Owner")}</p>
    </div>,
    normalized: "Owner" as GroupRole
  }, {
    original: <div className="group-role">
      <span>{Text.roleDisplayName("Member")}</span>
      <p>{Text.roleDescription("Member")}</p>
    </div>,
    normalized: "Member" as GroupRole
  }];

  constructor(props: MemberProps) {
    super(props);
    this.state = { open: "" }
  }

  changeRole(uid: string, role: string) {
    let { list, dispatch, groupId, Svcs } = this.props;
    Svcs.Api.putGroupIndividual(groupId, uid, {role})
            .then(() => {
              let group_individuals = _.cloneDeep(list.group_individuals);
              let ind = _.find(group_individuals, (i) => i.uid === uid);
              ind ? ind.role = role as GroupRole : null;
              dispatch({
                type: "GROUP_UPDATE",
                groupId,
                members: { group_individuals }
              });
            });
  }

  render() {
    let { list, state, groupId, selfGIM } = this.props;
    return <div className="panel">
      { _.map(list.group_individuals, (gim) => {
        // Don't render this individual if its UID does not exist
        if (!gim.uid) return null;
        let uid = gim.uid;
        let associatedTeam =
          _.find(list.group_teams, (m) => m.email === gim.email);
        let displayName = associatedTeam ? associatedTeam.name : gim.email;
        let choices = new OrderedSet(this.ROLE_LIST, (role) => role.normalized);

        let canRemove = this.props.isSuper ||
          (selfGIM ? selfGIM.uid === gim.uid : false);
        let canEditCals = ready(state.login) ?
          (associatedTeam && associatedTeam.email === state.login.email)
          : false;

        return <div key={gim.uid} className="panel group-member-item">
          <Tooltip target={
            <button
              className="group-calendar"
              disabled={!(associatedTeam && canEditCals)}
              onClick={() => {
                if (associatedTeam) {
                  fetchAvailableCalendars(associatedTeam.teamid,
                                          this.props);
                  fetchSelectedCalendars(associatedTeam.teamid,
                                          this.props);
                  this.setState({ open: associatedTeam.teamid });
                }
              }}>
                <Icon type={
                  associatedTeam ? "calendar-check" : "calendar-empty"}
                />
            </button>}
            title={
              canEditCals ?
              Text.GroupCalendarSharingEdit :
              ( associatedTeam ?
                Text.GroupCalendarSharingYes :
                Text.GroupCalendarSharingNo ) }
          />
          { this.state.open && associatedTeam && canEditCals ?
            this.renderModal(associatedTeam.teamid) : null }
          { displayName }
          <button className="gim-remove" disabled={!canRemove} onClick={() =>
            removeGroupIndividual(groupId, gim, this.props)}>
            { canRemove ? <Icon type="remove" /> : null }
          </button>
          { this.props.isSuper ?
              <Dropdown
                toggle={<button className="dropdown-toggle group-role-badge">
                  { Text.roleDisplayName(gim.role) }
                  {" "}
                  <Icon type="caret-down" />
                </button>}

                menu={<div className="dropdown-menu">
                  <Menu choices={choices}
                    onSelect={(choice, _) =>
                      this.changeRole(uid, choice.normalized)}
                    selected={{original: "", normalized: gim.role}} />
                </div>}
              /> :
              <button className="group-role-badge" disabled>
                { Text.roleDisplayName(gim.role) }
              </button>
          }
        </div>;
      })}
    </div>;
  }

  renderModal(teamId: string) {
    let calendars = this.props.state.teamCalendars[teamId];
    if (teamId !== this.state.open || !calendars) return null;
    return <Modal header={<Icon type="calendar">Share calendars</Icon>}
                  onClose={() => this.setState({ open: "" })}>
      <div className="content">
        { ready(calendars.available) ?
          <div className="panel menu">
            { _.map(calendars.available, (c) => {
              let selected = ready(calendars.selected) ?
                !!_.find(calendars.selected, (s) => s.id === c.id) : false;
              return <label key={c.id} onClick={() =>
                this.updateSelectedCalendars(teamId, c, calendars.selected)}
                className={classNames("panel checkbox-item", {selected})}>
                <Icon type={selected ? "calendar-check" : "calendar-empty"}>
                  {c.title}
                </Icon>
              </label>;
            })}
          </div> : <div className="spinner" />
        }
      </div>
    </Modal>;
  }

  updateSelectedCalendars(teamId: string,
                          choice: GenericCalendar,
                          cals?: StoreData<GenericCalendar[]>) {
    if (!ready(cals)) return;

    let selected = !!_.find(cals, (c) => c.id === choice.id) ?
      _.filter(cals, (c) => c.id !== choice.id) : _.concat(cals, choice);
    updateSelectedCalendars(teamId, selected, this.props);
  }
}

export default Settings;
