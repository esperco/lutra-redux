/*
  This is the main view for the settings page
*/

require("less/components/_group-settings.less");
import * as React from 'react';
import * as _ from 'lodash';
import { generalSettings, eventList } from "./paths";
import { LoggedInState, DispatchFn } from './types';
import SettingsNav from "./SettingsNav";
import CheckboxItem from "../components/CheckboxItem";
import delay from '../components/DelayedControl';
import FilterMenu from "../components/FilterMenu";
import Icon from '../components/Icon';
import { Menu, Choice } from '../components/Menu';
import TextInput from "../components/TextInput";
import TimezoneDropdown from '../components/TimezoneDropdown';
import Tooltip from '../components/Tooltip';
import { Dropdown } from '../components/Dropdown';
import { Modal } from '../components/Modal';
import TeamCalendarsSelector from "../components/TeamCalendarsSelector"
import * as TeamCals from '../handlers/team-cals';
import * as TeamPrefs from "../handlers/team-prefs";
import * as Groups from '../handlers/groups';
import { ApiSvc } from "../lib/api";
import {
  GenericCalendar, GroupRole, GroupIndividual, GroupMember
} from "../lib/apiT";
import { NavSvc } from "../lib/routing";
import { OrderedSet, ChoiceSet, validateEmailAddress } from "../lib/util";
import { GroupMembers, GroupSummary } from '../states/groups';
import { ok, ready } from '../states/data-status';
import { GenericErrorMsg } from "../text/error-text";
import { EmailPlaceholder } from "../text/common";
import * as Text from "../text/groups";
import * as MiscText from "../text/misc";

interface Props {
  groupId: string;
  editTeamId?: string;
  onboarding?: boolean;
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
        { this.props.onboarding ? null : <SettingsNav {...this.props} /> }
        <SummaryInfo {...subprops} />
        <NoTeamMessage {...subprops} />
        <GroupMembersInfo {...subprops} />
        <AddMemberButton {...subprops} />
        { this.props.onboarding ? <NextButton {...subprops} /> : null }
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
    let { groupId, isSuper } = this.props;
    return <div className="panel">
      <div className="form-row">
        <label htmlFor="group-name">
          { Text.GroupName }
        </label>
        { delay({
          value: this.props.summary.group_name,
          onChange: (value: string) =>
            Groups.renameGroup(groupId, value, this.props),
          component: (props) => <TextInput
            { ...props}
            id="group-name"
            placeholder={Text.GroupNamePlaceholder}
            disabled={!isSuper}
          />
        }) }
      </div>

      <div className="form-row">
        <label htmlFor="group-timezone">
          { Text.GroupTimezone }
        </label>
        <TimezoneDropdown
          disabled={!isSuper}
          value={this.props.summary.group_timezone}
          onChange={(z) => Groups.patchGroupDetails(this.props.groupId, {
            group_timezone: z
          }, this.props)}
        />
      </div>
    </div>;
  }
}


/*
  Show message if current user isn't sharing any teams with group
*/
class NoTeamMessage extends React.Component<Subprops, {}> {
  render() {
    let myEmail = this.props.state.login.email;
    let myTeam =
      _.find(this.props.members.group_teams, (t) => t.email === myEmail);
    if (myTeam) {
      return null;
    }

    return <div className="alert info">
      { Text.GroupNoTeamDescription }
    </div>;
  }
}


class GroupMembersInfo extends React.Component<Subprops, {}> {
  render() {
    let { members } = this.props;
    let numAdmins = _.filter(members.group_individuals,
      (i) => i.role === "Owner").length;

    return <div className="panel">
      { _.map(members.group_individuals,
        // Render member only if UID exists
        (gim) => <SingleMemberInfo
          key={gim.email || gim.uid}
          {...this.props}
          gim={gim}
          noEdit={numAdmins <= 1 && gim.role === "Owner"}
        />
      ) }
    </div>;
  }
}


interface SingleMemberProps extends Subprops {
  gim: GroupIndividual;
  noEdit?: boolean;
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
    let { gim, members, dispatch, groupId, Svcs } = this.props;
    if (gim.uid) {
      let uid = gim.uid;
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
  }

  render() {
    let { gim, members, groupId, selfGIM } = this.props;
    let associatedTeam =
      _.find(members.group_teams, (m) => m.email === gim.email);
    let displayName = associatedTeam ?
      (associatedTeam.name || associatedTeam.email) :
      gim.email;
    let choices = new OrderedSet(this.ROLE_LIST, (role) => role.normalized);

    let canRemove = gim.uid && !this.props.noEdit && (this.props.isSuper ||
      (selfGIM ? selfGIM.uid === gim.uid : false));
    let canEditCals = gim.uid && (selfGIM ? selfGIM.uid === gim.uid : false);

    return <div className="row gim">
      <Tooltip target={
        <button
          className="group-calendar"
          disabled={!canEditCals}
          onClick={() => this.editCals(associatedTeam)}>
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

      <span className="gim-name">{ displayName }</span>

      { this.props.isSuper && this.props.gim.uid && !this.props.noEdit?
        <Dropdown
          toggle={<button className="dropdown-toggle group-role-badge">
            { Text.roleDisplayName(gim.role) }
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
      <button className="gim-remove" disabled={!canRemove} onClick={() =>
        Groups.removeGroupIndividual(groupId, gim, this.props)}>
        { canRemove ? <Icon type="remove" /> : null }
      </button>
    </div>;
  }

  // TODO - refactor into handler?
  editCals(associatedTeam?: GroupMember) {
    if (associatedTeam) {
      this.props.Svcs.Nav.go(generalSettings.href({
        groupId: this.props.groupId,
        onboarding: this.props.onboarding,
        editTeamId: associatedTeam.teamid
      }))
    }

    // Create team for self
    else if (this.props.gim.email === this.props.state.login.email) {
      Groups.addSelfTeam(
        this.props.groupId,
        this.props
      ).then((gm) => {
        this.props.Svcs.Nav.go(generalSettings.href({
          groupId: this.props.groupId,
          onboarding: this.props.onboarding,
          editTeamId: gm.teamid
        }));
      });
    }
  }
}


class AddMemberButton extends React.Component<Subprops, {}> {
  _dropdown: Dropdown;

  render() {
    let emails = this.getEmails();
    let filterFn = (str: string) => {
      str = str.trim().toLowerCase();
      let filtered = emails.filter((c) => _.includes(c.normalized, str));
      let match = filtered.getByKey(str);
      if (match && filtered.has(match)) {
        filtered = filtered.without(match);
      }
      return [match, filtered.toList()] as [Choice|undefined, Choice[]];
    };

    return <div className="invite-member"><Dropdown
      ref={(c) => this._dropdown = c}
      toggle={<button>
        { Text.AddMember }
      </button>}

      menu={<div className="dropdown-menu">
        <FilterMenu choices={emails}
          filterProps={{
            placeholder: EmailPlaceholder
          }}
          onAdd={(str) => this.add(str)}
          onSelect={(choice) => this.add(choice.normalized)}
          filterFn={filterFn}
          validateAdd={validateEmailAddress}
        />
      </div>}
    /></div>;
  }

  add(email: string) {
    Groups.addGroupIndividual(this.props.groupId, email, this.props);
    if (this._dropdown) {
      this._dropdown.close();
    }
  }

  // Extract emails from available calendars
  getEmails() {
    let gims = new OrderedSet(
      this.props.members.group_individuals,
      (g) => g.email || ""
    );
    let emails = new ChoiceSet<Choice>([]);
    let inviteEmails = this.props.state.inviteEmails;

    if (ready(inviteEmails)) {
      _.each(inviteEmails, (v, k) => {
        if (v && k && !gims.hasKey(k)) { // Exclude already included emails
          emails.push({
            original: k,
            normalized: k.trim().toLowerCase()
          });
        }
      })
    }
    return emails;
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
        { this.renderEsperLinkToggle() }
        { ready(calendars.available) && ready(calendars.selected) ?
          this.renderCalendars(calendars.available, calendars.selected) :
          <div className="spinner" /> }
      </div>
      <footer>
        <button onClick={() => this.unshare()}>
          { Text.GroupDisableCalendarSharing }
        </button>
      </footer>
    </Modal>;
  }

  renderEsperLinkToggle() {
    let prefs = this.props.state.teamPreferences[this.props.editTeamId];
    if (ready(prefs)) {
      return <div className="panel menu">
        <CheckboxItem
          checked={!!prefs.event_link}
          onChange={(v) => this.updateLink(v)}>
          <span>{ MiscText.EsperLink }</span>
          <p className="description">
            { MiscText.EsperLinkDescription }
          </p>
        </CheckboxItem>
      </div>;
    }

    return <div className="panel">
      <div className="placeholder" />
    </div>;
  }

  renderCalendars(available: GenericCalendar[], selected: GenericCalendar[]) {
    return <div className="panel">
      <TeamCalendarsSelector
        available={available}
        selected={selected}
        onChange={(cal, value) => TeamCals.toggleCalendar({
          teamId: this.props.editTeamId,
          cal, value
        }, this.props)}
      />
    </div>;
  }

  closeModal = () => {
    this.props.Svcs.Nav.go(generalSettings.href({
      groupId: this.props.groupId,
      onboarding: this.props.onboarding
    }));
  }

  unshare() {
    Groups.removeTeam(
      this.props.groupId,
      this.props.editTeamId,
      this.props
    );
    this.closeModal();
  }

  updateLink(val: boolean) {
    TeamPrefs.update(this.props.editTeamId, {
      event_link: val
    }, this.props);
  }
}


// Go to next screen in onboarding process
class NextButton extends React.Component<Subprops, {}> {
  render() {
    let disabled = !this.props.members.group_teams.length;
    return <div className="onboarding-end">
      <p>{ disabled ? Text.NoTeamBtnTooltip : null }</p>
      <div>
        <button className="primary" disabled={disabled} onClick={this.next}>
          { Text.GroupOnboardingEnd }
        </button>
      </div>
    </div>;
  }

  next = () => {
    this.props.Svcs.Nav.go(eventList.href({ groupId: this.props.groupId }));
  }
}


export default GeneralSettings;
