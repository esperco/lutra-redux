/*
  Staging login for when Oauth isn't available
*/
import * as React from "react";

interface Props {
  onLogin: (x: {
    email: string;
    uid: string;
    apiSecret: string;
  }) => void;
}
interface State {}

export class StagingLogin extends React.Component<Props, State> {
  _email: HTMLInputElement|null;
  _uid: HTMLInputElement|null;
  _apiSecret: HTMLInputElement|null;

  render() {
    return <div className="panel" style={{textAlign: "left"}}>
      <div>
        <label htmlFor="staging-email">E-mail</label>
        <input id="staging-email" type="text"
          ref={(c) => this._email = c}
          defaultValue="lois@esper.com"
          className="form-control" />
      </div>
      <div>
        <label htmlFor="staging-uid">UID</label>
        <input id="staging-uid" type="text"
          ref={(c) => this._uid = c}
          defaultValue="O-w_lois_____________w"
          className="form-control" />
      </div>
      <div>
        <label htmlFor="staging-secret">API Secret</label>
        <input id="staging-secret" type="password"
          ref={(c) => this._apiSecret = c}
          defaultValue="lois_secret"
          className="form-control" />
      </div>
      <div>
        <button className="btn primary" style={{width: "100%"}}
                onClick={() => this.handleLogin()}>
          Login
        </button>
      </div>
    </div>;
  }

  handleLogin() {
    if (this._email && this._uid && this._apiSecret) {
      let email = this._email.value;
      let uid = this._uid.value;
      let apiSecret = this._apiSecret.value;
      this.props.onLogin({ email, uid, apiSecret });
    }
  }
}

export default StagingLogin;