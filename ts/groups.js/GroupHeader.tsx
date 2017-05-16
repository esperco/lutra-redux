/*
  Header element for groups pages
*/

import * as React from 'react';
import * as Conf from 'config';
import { LoggedInState, DispatchFn } from './types';
import { ready } from "../states/data-status";
import { ScrollState } from "../states/scroll";
import { makeNewGroup } from "../handlers/groups";
import { ApiSvc } from "../lib/api";
import { NavSvc } from "../lib/routing";
import * as Paths from "./paths";
import * as CommonText from "../text/common";
import * as GroupText from "../text/groups";
import Dropdown from "../components/Dropdown";
import Icon from "../components/Icon";
import GroupSelector from "./GroupSelector";
import * as CommonPaths from "../lib/paths";
import * as SweepPaths from "../tb.js/paths";
import * as TimePaths from "../time.js/paths";

class Props {
  state: LoggedInState & ScrollState;
  dispatch: DispatchFn;
  Svcs: ApiSvc & NavSvc;
  Conf: typeof Conf; // Don't use config directly -- let index pass it
                     // for ease of testing
}

function routeHasGroupId(x: any): x is {groupId: string} {
  return !!(x && x.groupId);
}

class GroupHeader extends React.Component<Props, {}> {
  render() {
    return <header className={
      this.props.state.lastScroll === "down" ? "hide" : ""
    }>
      <h2 className="logo-mark"><a href="#!/">
        <img alt="Esper" src="/img/esper-logo-purple.svg" />
      </a></h2>
      { this.renderGroupWidget() }
      { this.renderAccountsDropdown() }
    </header>;
  }

  // Get active group Id, if any
  getGroupId(): string|undefined {
    let route = this.props.state.route;
    if (routeHasGroupId(route)) {
      return route.groupId;
    }
    return;
  }

  // Get active group, if any
  getGroup() {
    let groupId = this.getGroupId();
    if (groupId) {
      let summary = this.props.state.groupSummaries[groupId];
      if (ready(summary)) return summary;
    }
    return undefined;
  }

  renderGroupWidget() {
    let summary = this.getGroup();
    if (summary) {
      return <h1>
        { summary.group_name }
      </h1>;
    }

    // Return something (acts as a spacer)
    return <div />;
  }

  renderAccountsDropdown() {
    let toggle = <button>
      <Icon type="accounts" />
    </button>;

    let groupId = this.getGroupId() || "default";
    let menu = <div className="dropdown-menu">
      <div className="panel">
        { this.props.state.login.email }
      </div>

      { this.renderGroupsSelector(groupId) }

      <div className="menu">
        <button onClick={this.create}>{ GroupText.CreateGroup }</button>
      </div>

      <nav className="panel">
        <a href={TimePaths.Home.href({})}>
          <Icon type="person">{ CommonText.ExecLink }</Icon>
        </a>
        <a href={SweepPaths.base}>
          <Icon type="check">{ CommonText.SweepLink }</Icon>
        </a>
        <a href={Paths.generalSettings.href({ groupId })}>
          <Icon type="settings">{ CommonText.Settings }</Icon>
        </a>
      </nav>

      <nav className="panel">
        <a href={CommonPaths.Home.href({})}>
          <Icon type="home">{ CommonText.Home }</Icon>
        </a>
        <a href={CommonPaths.Contact.href({})}>
          <Icon type="contact">{ CommonText.Contact }</Icon>
        </a>
        <a href={CommonPaths.Privacy.href({})}>
          <Icon type="privacy">{ CommonText.Privacy }</Icon>
        </a>
        <a href={CommonPaths.Terms.href({})}>
          <Icon type="terms">{ CommonText.Terms }</Icon>
        </a>
      </nav>

      <nav className="panel">
        <a href={this.props.Conf.logoutRedirect}>
          <Icon type="logout">{ CommonText.Logout }</Icon>
        </a>
      </nav>
    </div>;

    return <Dropdown
      toggle={toggle}
      menu={menu}
    />;
  }

  renderGroupsSelector(groupId?: string) {
    let login = this.props.state.login;
    if (login.groups.length > 1) {
      let hrefFn = (() => {
        if (this.props.state.route) {
          switch (this.props.state.route.page) {
            case "GroupGeneralSettings":
            case "GroupNotificationSettings":
            case "GroupMiscSettings":
              return (groupId: string) => Paths.generalSettings.href({
                groupId
              });
          }
        }
        return (groupId: string) => Paths.eventList.href({ groupId });
      })();

      return <div className="panel">
        <h4>{ GroupText.Groups }</h4>
        <GroupSelector
          selected={groupId}
          state={this.props.state}
          getHref={hrefFn}
        />
      </div>;
    }
    return null;
  }

  create = () => {
    makeNewGroup((groupId) => Paths.generalSettings.href({
      groupId,
      onboarding: true
    }), this.props);
  }
}

export default GroupHeader;
