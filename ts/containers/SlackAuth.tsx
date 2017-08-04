/*
  Redux-aware Slack auth button
*/

import * as React from "react";
import Icon from "../components/Icon";
import { ApiSvc } from "../lib/api";
import * as ApiT from "../lib/apiT";
import { NavSvc } from "../lib/routing";
import * as TeamPrefs from "../handlers/team-prefs";
import * as PrefsState from "../states/team-preferences";
import * as Text from "../text/slack";

export interface Deps {
  dispatch: (action: PrefsState.UpdateAction) => void;
  state: PrefsState.TeamPreferencesState;
  Svcs: ApiSvc & NavSvc;
}

export interface Props extends React.HTMLProps<HTMLButtonElement> {
  teamId: string;
  fb?: boolean;
  tb?: boolean;
  deps: Deps;
}

interface State {
  busy?: boolean;
}

export class SlackAuth extends React.Component<Props, State> {
  state = { busy: false };

  render() {
    let { teamId, deps, children, tb, fb, ...btnProps } = this.props;
    let childCount = !!React.Children.count(children);
    return <button
      disabled={this.state.busy}
      onClick={this.onBtnClick}
      {...btnProps}
    >
      <Icon type="slack">
        { childCount ? this.props.children :
          <span>{ Text.SlackSetupAction }</span> }
      </Icon>
    </button>;
  }

  onBtnClick = () => {
    this.setState({ busy: true });
    let update: Partial<ApiT.Preferences> = {};
    if (typeof this.props.tb !== undefined) {
      update.tb_allow_slack_notif = this.props.tb;
    }
    if (typeof this.props.fb !== undefined) {
      update.fb_allow_slack_notif = this.props.fb;
    }
    TeamPrefs.enableSlack(this.props.teamId, update, this.props.deps)
      // Never-ending promise, wait for redirect
      .then(() => new Promise(() => {}))
      .catch((err) => this.setState({ busy: false }));
  }
}

export default SlackAuth;