/*
  Navigation bar for the settings page.
*/

import * as React from 'react';
import * as classNames from 'classnames';
import * as Paths from "./paths";
import { State, DispatchFn } from './types';
import Icon from "../components/Icon";
import { LabelSettingsHeading } from "../text/labels";
import * as Text from "../text/common";

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
          { Text.GeneralSettingsHeading }
       </a>

       <a className={classNames("settings-link", {
          active: page === "GroupLabelSettings"
        })} href={Paths.labelSettings.href({ groupId })}>
          { LabelSettingsHeading }
       </a>

       <a className={classNames("settings-link", {
          active: page === "GroupNotificationSettings"
        })} href={Paths.notificationSettings.href({ groupId })}>
          { Text.NotificationSettingsHeading }
        </a>

        <a className={classNames("settings-link", {
          active: page === "GroupMiscSettings"
        })} href={Paths.miscSettings.href({ groupId })}>
          { Text.MiscSettingsHeading }
        </a>
      </nav>
    </header>;
  }
}

export default SettingsNav;
