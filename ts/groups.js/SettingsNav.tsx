/*
  Navigation bar for the settings page.
*/

import * as React from 'react';
import * as classNames from 'classnames';
import * as Paths from "./paths";
import { State, DispatchFn } from './types';
import { SettingTypes } from './routes';

class Props {
  groupId: string;
  page: SettingTypes;
  state: State;
  dispatch: DispatchFn;
}

class SettingsNav extends React.Component<Props, {}> {
  render() {
    return <nav className="settings-nav">
      <a className={classNames("settings-link", {
           active: this.props.page === "GeneralSettings"
         })}
         href={Paths.generalSettings.href({
           groupId: this.props.groupId
         })}>
        General
      </a>
      <a className={classNames("settings-link", {
           active: this.props.page === "LabelSettings"
         })} href={Paths.setup.href({})}>
        Tags
      </a>
      <a className={classNames("settings-link", {
           active: this.props.page === "NotificationSettings"
         })}
         href={Paths.setup.href({})}>
        Notifications
      </a>
      <a className={classNames("settings-link", {
           active: this.props.page === "BillingSettings"
         })}
         href={Paths.setup.href({})}>
        Billing
      </a>
    </nav>;
  }
}

export default SettingsNav;
