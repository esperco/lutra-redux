/*
  Modal requiring user approves suspicious teams
*/

import * as _ from "lodash";
import * as React from "react";
import * as classNames from "classnames";
import { ApiSvc } from "../lib/api";
import * as ApiT from "../lib/apiT";
import { AnalyticsSvc } from "../lib/analytics";
import { LocalStoreSvc }  from "../lib/local-store";
import * as Login from "../lib/login";
import { NavSvc } from "../lib/routing"
import { Loading } from "../text/data-status";
import { GenericErrorMsg } from "../text/error-text";
import * as LoginText from "../text/login";
import ApproveTeam from "./ApproveTeam";
import StagingLogin from "./StagingLogin";
import LoginButtons from "./LoginButtons";
import * as Oauth from "./oauth";

/*
  Login container component
*/
export type View = {
  type: "LOGIN";
  email?: string;
  initNylas?: boolean;
  invite?: string;
  landingUrl?: string;
}|{
  type: "APPROVE_TEAM";
  team: ApiT.Team;
  profiles: ApiT.Profile[];
  redirect: string;
}|{
  type: "STAGING_LOGIN";
}|{
  type: "REDIRECT";
}

export type Message = ["message"|"error", string|JSX.Element];

export interface BaseProps {
  initMsg?: Message;
  initView?: View;
}

interface Props extends BaseProps {
  Svcs: ApiSvc & AnalyticsSvc & LocalStoreSvc & NavSvc;
}

interface State {
  busy: boolean;
  view: View;
  msg?: Message;
}

function showStagingLogin() {
  return _.includes(location.hostname, "staging") ||
         _.includes(location.hostname, "localhost");
}

function handleStagingLogin(
  creds: { uid: string; apiSecret: string; email: string; },
  Svcs: ApiSvc & LocalStoreSvc & NavSvc
) {
  Login.setCredentials({
    uid: creds.uid,
    api_secret: creds.apiSecret,
    email: creds.email
  }, Svcs);
  Svcs.Nav.go("/login?staging=1");
}

export class LoginContainer extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      busy: false,
      view: props.initView || { type: "LOGIN" },
      msg: props.initMsg
    };
  }

  render() {
    if (this.state.view.type === "REDIRECT") {
      return <div>
        <div className="alert info">
          { LoginText.RedirectMsg }
        </div>
        <div className="panel">
          <div className="spinner" />
        </div>
      </div>
    }

    return <div>
      { this.state.msg ? <div className={classNames("alert", {
        info: this.state.msg[0] === "message",
        danger: this.state.msg[0] === "error"
      })}>
        { this.state.msg[1] }
      </div> : null }

      { this.renderBody() }

      { this.state.busy ?
        <div><span className="spinner" /> {Loading}</div> :
        <div className="note">{ LoginText.TOSNote }</div> }
      { showStagingLogin() ? <a onClick={() => this.setState({
        view: { type: "STAGING_LOGIN" }
      })}>
        Staging Login
      </a> : null }
    </div>;
  }

  renderBody() {
    let view = this.state.view;
    switch (view.type) {
      case "APPROVE_TEAM":
        let { redirect } = view;
        return <ApproveTeam {...view}
          onApprove={() => this.props.Svcs.Nav.go(redirect)}
          onReject={() => this.props.Svcs.Nav.go("/login?msg=reject_team")}
          Svcs={this.props.Svcs}
        />;

      case "STAGING_LOGIN":
        return <StagingLogin
          onLogin={(x) => handleStagingLogin(x, this.props.Svcs)}
        />;

      case "LOGIN":
        let { landingUrl, invite } = view;
        return <LoginButtons
          disabled={this.state.busy}
          email={view.email}
          initNylas={view.initNylas}
          onGoogle={(email) => this.wrap(Oauth.loginWithGoogle({
            email, landingUrl, invite
          }, this.props.Svcs))}
          onNylas={(email) => this.wrap(Oauth.loginWithNylas({
            email, landingUrl, invite
          }, this.props.Svcs))}
        />;

      // REDIRECT (should be handled in render() but
      // add fallback in case it isn't)
      default:
        return <div className="spinner" />;
    }
  }

  // Wrap Oauth calls to update state
  wrap(p: Promise<any>) {
    this.showBusyMsg();
    p.catch(() => this.showErrorMsg());
  }

  showBusyMsg() {
    this.setState({
      busy: true
    });
  }

  showErrorMsg() {
    this.setState({
      busy: false,
      msg: ["error", GenericErrorMsg]
    });
  }
}

export default LoginContainer;