/*
  Shows three login buttons
*/
import * as React from "react";
import * as classNames from "classnames";
import Icon from "../components/Icon";
import { validateEmailAddress } from "../lib/util";

interface Props {
  disabled?: boolean;
  email?: string;      // Prefilled email
  initNylas?: boolean; // Start on Nylas page?
  onGoogle: (email?: string) => void;
  onNylas: (email: string) => void;
}

interface State {
  showNylas: boolean;
  validationError: boolean;
}

export class LoginButtons extends React.Component<Props, State> {
  _email: HTMLInputElement;

  constructor(props: Props) {
    super(props);
    this.state = {
      showNylas: !!props.initNylas,
      validationError: false
    };
  }

  render() {
    return <div id="login-btns" className="panel">
      { this.state.showNylas ? this.renderNylas() : this.renderButtons() }
    </div>
  }

  renderButtons() {
    return <div className="login-buttons">
      <button id="google-btn"
        className="cta primary"
        disabled={this.props.disabled}
        onClick={this.submitGoogle}>
        <span className="sign-in-icon">
          <i className="fa fa-fw fa-google" />
        </span>
        <span className="sign-in-text">Google Calendar</span>
      </button>

      <button id="exchange-btn"
        className="cta primary"
        disabled={this.props.disabled}
        onClick={() => this.setState({ showNylas: true })}>
        <span className="sign-in-icon">
          <img src="img/exchange.svg" />
        </span>
        <span className="sign-in-text">
          Microsoft Exchange
        </span>
      </button>

      <button id="other-btn"
        className="cta secondary"
        disabled={this.props.disabled}
        onClick={() => this.setState({ showNylas: true })}>
        <span className="sign-in-icon">
          <i className="fa fa-fw fa-calendar-o" />
        </span>
        <span className="sign-in-text">Other Provider</span>
      </button>
    </div>;
  }

  renderNylas() {
    return <form onSubmit={this.submitNylas} className={classNames({
      "nylas-form": true,
      "has-error": this.state.validationError
    })}>
      <button type="button" onClick={() => this.setState({ showNylas: false })}>
        <Icon type="previous" />
      </button>
      <label htmlFor="login-email">What's Your Email Address</label>
      <input id="login-email" type="email"
        ref={(c) => this._email = c}
        autoFocus={true}
        placeholder="name@email.com"
        required />
      <input type="submit" className="cta"
        disabled={this.props.disabled} value="Continue" />
    </form>;
  }

  submitGoogle = () => this.props.onGoogle(this.props.email);

  submitNylas = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (this._email) {
      this.setState({ validationError: false });
      let email = this._email.value;
      if (validateEmailAddress(email)) {
        this.props.onNylas(email);
      } else {
        this.setState({ validationError: true });
      }
    }
  }
}

export default LoginButtons;