/*
  Shared header element for our app pages -- can be hidden on scroll.
  Pass child element for it to display in place of logo on left.
*/
require("less/components/_app-header.less");
import * as React from 'react';
import * as Conf from 'config';
import { ScrollState } from "../states/scroll";
import { ApiSvc } from "../lib/api";
import { LoggedInState } from "../lib/login";
import { NavSvc } from "../lib/routing";
import * as CommonText from "../text/common";
import Dropdown from "../components/Dropdown";
import Icon from "../components/Icon";
import * as CommonPaths from "../lib/paths";
import { base as agendaPath } from "../tb.js/paths";
import { base as execPath } from "../time.js/paths";
import { base as groupsPath } from "../groups.js/paths";

class Props {
  children?: React.ReactNode|React.ReactNode[];
  active?: "charts"|"ratings"|"agenda-check"; // Which link is active

  // Deps
  state: LoggedInState & ScrollState;
  Svcs: ApiSvc & NavSvc;
  Conf: typeof Conf; // Don't use config directly -- let index pass it
                     // for ease of testing
}

export class AppHeader extends React.Component<Props, {}> {
  render() {
    let { active, state } = this.props;

    // Charts link depends on feature flags or,
    // alternatively, whether this is a groups user or not
    let hasGroups = false;
    if (state.login.feature_flags.group_charts) hasGroups = true;
    else if (!state.login.feature_flags.team_charts) {
      hasGroups = !!state.login.groups.length;
    }
    let chartsPath = hasGroups ? groupsPath : execPath;

    return <header id="app-header" className={
      this.props.state.lastScroll === "down" ? "hide" : ""
    }>
      <h2 className="logo-mark"><a href="#!/">
        <img alt="Esper Logo" src="/img/esper-logo-purple.svg" />
        { this.props.children ? null :
          <img alt="Esper" src="/img/word-mark.svg" /> }
      </a></h2>

      { this.props.children }

      <div style={{ flexGrow: 1, flexShrink: 1 }} /> {/* Spacer */}

      <nav style={{ flexGrow: 0, flexShrink: 0 }}>
        <Link href={chartsPath} active={active === "charts"}>
          <Icon type="charts">{ CommonText.ChartLink }</Icon>
        </Link>
        {/* <Link href="" active={active === "ratings"}>
          <Icon type="ratings">{ CommonText.RatingsLink }</Icon>
        </Link> */}
        <Link href={agendaPath} active={active === "agenda-check"}>
          <Icon type="agenda-check">{ CommonText.AgendaLink }</Icon>
        </Link>
        { this.renderDropdown() }
      </nav>
    </header>;
  }

  renderDropdown() {
    let toggle = <button>
      <Icon type="options-v" />
    </button>;

    let menu = <div className="dropdown-menu">
      <div className="panel">
        { this.props.state.login.email }
      </div>

      <nav className="panel">
        <a href={CommonPaths.settings.href({})}>
          <Icon type="settings">{ CommonText.Settings }</Icon>
        </a>
        <a href={CommonPaths.contact.href({})}>
          <Icon type="contact">{ CommonText.Contact }</Icon>
        </a>
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
}

const Link = (p: {
  href: string;
  active: boolean;
  children?: React.ReactNode|React.ReactNode[]
}) => <a href={p.href} className={p.active ? "active" : ""}>
  { p.children }
</a>

export default AppHeader;
