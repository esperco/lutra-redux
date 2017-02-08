/*
  Navigation bar for the settings page.
*/

import * as React from 'react';
import * as classNames from 'classnames';
import * as Paths from "./paths";
import { State, DispatchFn } from './types';
import Icon from "../components/Icon";

class Props {
  groupId: string;
  state: State;
  dispatch: DispatchFn;
}

class SettingsNav extends React.Component<Props, {}> {
  render() {
    let route = this.props.state.route;
    let page = route && route.page;
    let { groupId } = this.props;
    return <header>
      <a href={Paths.eventList.href({ groupId })}>
        <Icon type="previous" />
      </a>
      <nav>
        <a className={classNames("settings-link", {
          active: page === "GroupGeneralSettings"
        })} href={Paths.generalSettings.href({ groupId })}>
          General
       </a>

       <a className={classNames("settings-link", {
          active: page === "GroupNotificationSettings"
        })} href={Paths.notificationSettings.href({ groupId })}>
          Notifications
        </a>

        <a className={classNames("settings-link", {
          active: page === "GroupMiscSettings"
        })} href={Paths.miscSettings.href({ groupId })}>
          Misc
        </a>
      </nav>
    </header>;
  }
}

export default SettingsNav;
