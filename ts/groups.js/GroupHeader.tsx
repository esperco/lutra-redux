/*
  Header element for groups pages
*/

require("less/components/_group-header.less");
import * as React from 'react';
import * as Conf from 'config';
import { LoggedInState, DispatchFn } from './types';
import { ready } from "../states/data-status";
import { makeNewGroup } from "../handlers/groups";
import { ApiSvc } from "../lib/api";
import { NavSvc } from "../lib/routing";
import * as Paths from "./paths";
import * as CommonText from "../text/common";
import * as GroupText from "../text/groups";
import Header from "../components/AppHeader";
import Dropdown from "../components/Dropdown";
import Icon from "../components/Icon";
import * as TimePaths from "../time.js/paths";

class Props {
  state: LoggedInState;
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
    let groupId = this.getGroupId();
    if (groupId) {
      return <Header active="charts" {...this.props}>
        <Dropdown
          toggle={this.renderToggle(groupId)}
          menu={this.renderMenu(groupId)}
        />
      </Header>;
    }
    return <Header {...this.props} />;
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
  getSummary(groupId: string) {
    let summary = this.props.state.groupSummaries[groupId];
    if (ready(summary)) return summary;
    return;
  }

  renderToggle(groupId: string) {
    let summary = this.getSummary(groupId);
    return <h1><button>
      { summary ?
        <span>{ summary.group_name }</span> :
        <span className="placeholder" /> }
      <Icon type="caret-down" />
    </button></h1>;
  }

  renderMenu(groupId: string) {
    return <div className="dropdown-menu">
      <nav className="panel group-selector">
        { this.props.state.login.groups.map(
          (thisId) => this.renderGroup(thisId, thisId === groupId)
        ) }
      </nav>

      <div className="menu">
        <button onClick={this.create}>
          <Icon type="add">
            { GroupText.CreateGroup }
          </Icon>
        </button>
      </div>

      {/* TODO: Replace with list of teams and specific links */}
      <nav className="panel">
        <a href={TimePaths.Home.href({})}>
          <Icon type="person">{ CommonText.ExecLink }</Icon>
        </a>
      </nav>
    </div>;
  }

  renderGroup(groupId: string, active?: boolean) {
    let summary = this.getSummary(groupId);
    return <span key={groupId} className={active ? "active" : ""}>
      <a href={Paths.eventList.href({ groupId })}>
        <Icon type={ active ? "check" : "people" }>
          { summary ?
            <span>{ summary.group_name }</span> :
            <span className="placeholder" /> }
        </Icon>
      </a>

      <a href={Paths.settings.href({ groupId })}>
        <Icon type="settings" />
      </a>
    </span>;
  }

  create = () => {
    makeNewGroup((groupId) => Paths.generalSettings.href({
      groupId,
      onboarding: true
    }), this.props);
  }
}

export default GroupHeader;
