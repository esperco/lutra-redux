/*
  Header element for groups pages
*/

import * as React from 'react';
import * as Conf from 'config';
import { LoggedInState, DispatchFn } from './types';
import { ScrollState } from "../states/scroll";
import { ApiSvc } from "../lib/api";
import { NavSvc } from "../lib/routing";
import * as Paths from "./paths";
import * as CommonText from "../text/common";
import Dropdown from "../components/Dropdown";
import Icon from "../components/Icon";
import * as CommonPaths from "../lib/paths";

class Props {
  state: LoggedInState & ScrollState;
  dispatch: DispatchFn;
  Svcs: ApiSvc & NavSvc;
  Conf: typeof Conf; // Don't use config directly -- let index pass it
                     // for ease of testing
}

class TBHeader extends React.Component<Props, {}> {
  render() {
    return <header className={
      this.props.state.lastScroll === "down" ? "hide" : ""
    }>
      <h2 className="logo-mark"><a href="#!/">
        <img alt="Esper" src="/img/esper-logo-purple.svg" />
      </a></h2>

      <div /> {/* Spacer */}

      { this.renderAccountsDropdown() }
    </header>;
  }

  renderAccountsDropdown() {
    let toggle = <button>
      <Icon type="accounts" />
    </button>;

    let menu = <div className="dropdown-menu">
      <div className="panel">
        { this.props.state.login.email }
      </div>

      <nav className="panel">
        <a href={Paths.settings.href({})}>
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
}

export default TBHeader;
