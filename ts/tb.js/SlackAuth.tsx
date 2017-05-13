/*
  Generic Slack auth button
*/

import * as React from "react";
import { ApiSvc } from "../lib/api";
import { NavSvc } from "../lib/routing";
import * as TeamPrefs from "../handlers/team-prefs";
import * as PrefsState from "../states/team-preferences";
import * as TBText from "../text/timebomb";
import Icon from "../components/Icon";

interface Props extends React.HTMLProps<HTMLButtonElement> {
  teamId: string;
  deps: {
    dispatch: (action: PrefsState.UpdateAction) => void;
    state: PrefsState.TeamPreferencesState;
    Svcs: ApiSvc & NavSvc;
  }
}

interface State {
  busy?: boolean;
}

export class SlackAuth extends React.Component<Props, State> {
  state = { busy: false };

  render() {
    let { teamId, deps, children, ...btnProps } = this.props;
    let childCount = !!React.Children.count(children);
    return <button
      className="cta primary"
      disabled={this.state.busy}
      onClick={this.onBtnClick}
      {...btnProps}
    >
      <Icon type="slack">
        { childCount ? this.props.children :
          <span>{ TBText.SlackSetupAction }</span> }
      </Icon>
    </button>;
  }

  onBtnClick = () => {
    this.setState({ busy: true });
    TeamPrefs.enableSlack(this.props.teamId, {
      tb_allow_slack_notif: true
    }, this.props.deps)
      // Never-ending promise, wait for redirect
      .then(() => new Promise(() => {}))
      .catch((err) => this.setState({ busy: false }));
  }
}

export default SlackAuth;