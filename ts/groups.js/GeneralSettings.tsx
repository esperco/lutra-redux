/*
  This is the main view for the settings page
*/

import * as React from 'react';
import * as _ from 'lodash';
import { generalSettings } from "./paths";
import { LoggedInState, DispatchFn } from './types';
import CheckboxItem from "../components/CheckboxItem";
import delay from '../components/DelayedControl';
import Icon from '../components/Icon';
import { Menu, Choice } from '../components/Menu';
import TextInput from "../components/TextInput";
import TimezoneSelector, { toZoneName } from '../components/TimezoneSelector';
import Tooltip from '../components/Tooltip';
import { Dropdown } from '../components/Dropdown';
import { Modal } from '../components/Modal';
import * as TeamCals from '../handlers/team-cals';
import { renameGroup, removeGroupIndividual } from '../handlers/groups';
import { ApiSvc } from "../lib/api";
import { GenericCalendar, GroupRole, GroupIndividual } from "../lib/apiT";
import { NavSvc } from "../lib/routing";
import { OrderedSet } from "../lib/util";
import { Zones } from "../lib/timezones";
import { GroupMembers, GroupSummary } from '../states/groups';
import { ok, ready } from '../states/data-status';
import { GenericErrorMsg } from "../text/error-text";
import * as Text from "../text/groups";

interface Props {
  groupId: string;
  editTeamId?: string;
  state: LoggedInState;
  dispatch: DispatchFn;
  Svcs: ApiSvc & NavSvc;
}

class GeneralSettings extends React.Component<Props, {}> {
  render() {
    /*
      We need both summary and members for any part of settigns since the
      former indicates that group exists and the latter tells us what our
      permissions are.
    */
    let { groupId, state } = this.props;
    let summary = state.groupSummaries[groupId];
    let members = state.groupMembers[groupId];

    if (!ok(summary) && !ok(members)) {
      return GenericErrorMsg;
    }

    if (!ready(summary) || !ready(members)) {
      return <div className="spinner" />;
    }

     // Pull out permission-related vars for sub-components
    let selfGIM = _.find(members.group_individuals,
      (gim) => gim.email === state.login.email || gim.uid === state.login.uid
    );
    let isSuper = state.loggedInAsAdmin ||
      (selfGIM ? selfGIM.role === "Owner" : false);
    let subprops = { ...this.props,
      selfGIM,
      isSuper,
      members,
      summary
    };

    return <div className="content">
      <div className="container">
        <SummaryInfo {...subprops} />
        <GroupMembersInfo {...subprops} />
      </div>
    </div>;
  }
}


interface Subprops extends Props {
  summary: GroupSummary;
  members: GroupMembers;
  selfGIM: GroupIndividual | undefined;
  isSuper: boolean;
}

class SummaryInfo extends React.Component<Subprops, {}> {
  render() {
    let { groupId, summary, isSuper, dispatch, Svcs } = this.props;
    let timezone = _.find(Zones, (z) => z.id === summary.group_timezone);
    let zoneName = timezone ? timezone.display : "";

    let onSelect = (choice: Choice) => {
      let group_timezone = toZoneName(choice).id;

      // TODO: Move to handler
      Svcs.Api.putGroupTimezone(groupId, group_timezone).then(() =>
        dispatch({
          type: "GROUP_UPDATE",
          groupId,
          summary: { group_timezone }
        })
      );
    };

    return <div className="panel">
      <div className="form-row">
        <label htmlFor="group-name">
          { Text.GroupName }
        </label>
        { delay({
          value: this.props.summary.group_name,
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
          { Text.GroupTimezone }
        </label>
        { isSuper ?
          <Dropdown
            toggle={<button className="input-style">
              {zoneName}
            </button>}
            menu={<div className="dropdown-menu">
              <TimezoneSelector
                selected={this.props.summary.group_timezone}
                onSelect={onSelect} />
            </div>}
          /> :
          <input type="text" readOnly disabled value={zoneName} />
        }
      </div>
    </div>;
  }
}


class GroupMembersInfo extends React.Component<Subprops, {}> {
  render() {
    let { members } = this.props;
    return <div className="panel">
      { _.map(members.group_individuals,
        // Render member only if UID exists
        (gim) => gim.uid ? <SingleMemberInfo
          key={gim.uid}
          {...this.props}
          uid={gim.uid}
          gim={gim} /> : null
      ) }
    </div>;
  }
}


interface SingleMemberProps extends Subprops {
  uid: string;
  gim: GroupIndividual;
}

class SingleMemberInfo extends React.Component<SingleMemberProps, {}> {
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

  // TODO: Refactor into handler
  changeRole(role: string) {
    let { uid, members, dispatch, groupId, Svcs } = this.props;
    Svcs.Api.putGroupIndividual(groupId, uid, {role})
      .then(() => {
        let group_individuals = _.cloneDeep(members.group_individuals);
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
    let { gim, uid, members, state, groupId, selfGIM } = this.props;
    let associatedTeam =
      _.find(members.group_teams, (m) => m.email === gim.email);
    let displayName = associatedTeam ? associatedTeam.name : gim.email;
    let choices = new OrderedSet(this.ROLE_LIST, (role) => role.normalized);

    let canRemove = this.props.isSuper ||
      (selfGIM ? selfGIM.uid === uid : false);
    let canEditCals = ready(state.login) ?
      (associatedTeam && associatedTeam.email === state.login.email)
      : false;

    return <div className="panel group-member-item">
      <Tooltip target={
        <button
          className="group-calendar"
          disabled={!(associatedTeam && canEditCals)}
          onClick={() => associatedTeam &&
            this.props.Svcs.Nav.go(generalSettings.href({
              groupId: this.props.groupId,
              editTeamId: associatedTeam.teamid
            }))
          }>
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

      { this.props.editTeamId ?
        <MemberCalendarModal
          {...this.props}
          editTeamId={this.props.editTeamId}
        /> : null }

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
              onSelect={(choice) =>
                this.changeRole(choice.normalized)}
              selected={{original: "", normalized: gim.role}} />
          </div>}
        /> :
        <button className="group-role-badge" disabled>
          { Text.roleDisplayName(gim.role) }
        </button>
      }
    </div>;
  }
}


class MemberCalendarModal extends React.Component<SingleMemberProps & {
  editTeamId: string;
}, {}> {
  render() {
    let teamId = this.props.editTeamId;
    let calendars = this.props.state.teamCalendars[teamId];
    if (!calendars) return null;

    return <Modal header={<Icon type="calendar">Share calendars</Icon>}
                  onClose={this.closeModal}>
      <div className="content">
        { ready(calendars.available) && ready(calendars.selected) ?
          this.renderCalendars(calendars.available, calendars.selected) :
          <div className="spinner" /> }
      </div>
    </Modal>;
  }

  renderCalendars(available: GenericCalendar[], selected: GenericCalendar[]) {
    return <div className="panel menu">
      { _.map(available,
        (c) => <CheckboxItem key={c.id}
          checked={!!_.find(selected,
            (s) => s.id === c.id)}
          onChange={(v) => this.update(c, v)}>
          { c.title }
        </CheckboxItem>)}
    </div>;
  }

  closeModal = () => {
    this.props.Svcs.Nav.go(generalSettings.href({
      groupId: this.props.groupId
    }));
  }

  update(cal: GenericCalendar, value: boolean) {
    TeamCals.toggleCalendar({
      teamId: this.props.editTeamId,
      cal, value
    }, this.props);
  }
}



export default GeneralSettings;
