/*
  Component for posting timebomb tokens to server.
*/
require("less/components/_event-landing.less");
import * as React from "react";
import * as classNames from "classnames";
import DataStatus from "../components/DataStatus";
import delay, { DelayedControl } from "../components/DelayedControl";
import { EventInfo } from "../components/EventList";
import Icon from "../components/Icon";
import SuccessMark from "../components/SuccessMark";
import { BaseTimebombToggle } from "../components/TimebombToggle";
import { ApiSvc } from "../lib/api";
import { AnalyticsSvc } from "../lib/analytics";
import * as ApiT from "../lib/apiT";
import * as Log from "../lib/log";
import { wrapLast } from "../lib/queue";
import { NavSvc } from "../lib/routing";
import { hasTag } from "../lib/util";
import * as CommonText from "../text/common";
import * as ErrorText from "../text/error-text";
import * as EventText from "../text/events";
import * as TimebombText from "../text/timebomb";

type TokenMap = {
  keep: string;
  cancel: string;
};

type TokenAction = keyof TokenMap;

interface Props {
  actionOnMount?: TokenAction;
  onDone: () => void;
  tokens: TokenMap;
  Svcs: ApiSvc & NavSvc & AnalyticsSvc;
}

interface State {
  busy: boolean;
    // Busy posting token?
  error?: "Invalid_token"|"Expired_token"|"No_event"|"Other";
    // Error posting token?
  lastAction?: TokenAction;
    // Last action we took
  lastBlurb?: string;
    // Last blurb we entered into textbox, if any
  success?: boolean;
    // Show success page

  // Event returned by token call, if any
  event?: ApiT.GenericCalendarEvent;

  // UID of user, if any
  uid?: string;
}

export class EventLanding extends React.Component<Props, State> {
  _textbox: DelayedControl<string>|null = null;

  constructor(props: Props) {
    super(props);
    this.state = {
      busy: false,
      success: false
    };
  }

  // Normally, triggering API calls here isn't great form but we're
  // trying to avoid the overhead of using something like Redux here.
  componentDidMount() {
    let action = this.props.actionOnMount;
    if (action) {
      this.postInitToken(action);
    }
    this.props.Svcs.Analytics.page(location.pathname, { action });
  }

  // Special identification handling for inital token post
  async postInitToken(action: TokenAction) {
    let info = await this.postToken(action);
    if (info && info.uid) {
      this.props.Svcs.Analytics.identifyUID(info.uid);
    }
  }

  /*
    Overload token posting API. Blurb only applies when we
    "keep" the meeting.

    NB: Could replace first overload with just "keep" and make blurb
    optional in second overload, but have to deal this issue:
    https://github.com/Microsoft/TypeScript/issues/16053
  */
  async postToken(action: "keep"|"cancel")
    : Promise<ApiT.ConfirmTimebombInfo|void>;
  async postToken(action: "keep", blurb: string)
    : Promise<ApiT.ConfirmTimebombInfo|void>;
  async postToken(action: TokenAction, blurb?: string)
    : Promise<ApiT.ConfirmTimebombInfo|void>
  {
    // Busy indicator - optimistic UI updates
    this.setState({
      busy: true, error: undefined, lastAction: action, lastBlurb: blurb
    });

    /*
      Call appropriate API -- allow blurb only if keep/confirm token.
      Wrap API call in try block so we can gracefully show an error message.
    */

    let resp: ApiT.TokenResponse|"Invalid_token"|"Expired_token";
    try {
      resp = await this.postTokenAPI(action, blurb);
    }

    // Unknown API error
    catch (err) {
      this.setState({ busy: false, error: "Other" });
      Log.e(err);
      return;
    }

    // Save response to React state if applicable
    if (resp === "Invalid_token" || resp === "Expired_token") {
      this.setState({ busy: false, error: resp });
      return;
    }

    // Verify token has expeted value
    if (
      (action === "keep" &&
        hasTag("Confirm_timebomb_event", resp.token_value)) ||
      (action === "cancel" &&
        hasTag("Unconfirm_timebomb_event", resp.token_value))
    ) {
      let info = resp.token_value[1];
      let { event, uid } = info;
      this.setState({
        busy: false, event, uid,
        error: event ? undefined : "No_event"
      });
      return info;
    }

    // If we get here, we receive an unexpected token response
    this.setState({ busy: false, error: "Other" });
    Log.e("Wrong token", resp.token_value);
  }

  postTokenAPI = wrapLast((action: TokenAction, blurb?: string) => {
    let token = this.props.tokens[action];
    let { Api } = this.props.Svcs;
    return action === "keep" ?
      Api.postConfirmToken(token, blurb ? { blurb } : {}) :
      Api.postToken(token);
  });

  complete = async () => {
    let action = this.state.lastAction || this.props.actionOnMount;
    if (action === "keep") {
      let blurb: string = "";
      if (this._textbox) {
        blurb = this._textbox.getAndClear();
      }
      await this.postToken("keep", blurb);
    } else {
      await this.postToken("cancel");
    }
    this.setState({ success: true });
  }

  render() {
    if (this.state.success) {
      return <div className="event-landing">
        { this.renderSuccess() }
      </div>;
    }

    return <div className="event-landing">
      { this.renderError() }
      { this.renderEvent() }
      { this.renderDataStatus() }
      { this.renderDone() }
    </div>;
  }

  renderError() {
    let msg: string|JSX.Element|null = null;
    switch(this.state.error) {
      case "Invalid_token":
      case "Expired_token":
        msg = ErrorText.getText(403, { tag: this.state.error });
        break;
      case "No_event":
        msg = TimebombText.Stage2CancelledDescription();
        break;
      case "Other":
        msg = ErrorText.GenericErrorMsg;
        break;
      default:
        msg = null
    }

    return msg ? <div className="alert danger">
      { msg }
    </div> : null;
  }

  renderDataStatus() {
    return <DataStatus apiCalls={this.state.busy ? {token: false} : {}} />;
  }

  renderEvent() {
    if (this.state.event) {
      let tb = this.state.event.timebomb;
      let { uid, lastAction } = this.state;
      let disabled = !tb || !hasTag("Stage1", tb);
      let value = !!tb && this.getValue(tb);
      return <div>
        { tb ? this.renderAlert(tb) : null }
        <div className="flex">
          <div>
            <h2 className={classNames({
              "no-title": !this.state.event.title
            })}>
              { this.state.event.title || EventText.NoTitle }
            </h2>
            <EventInfo event={this.state.event} includeDay={true} />
          </div>
          <BaseTimebombToggle
            name={"timebomb-" + this.state.event.id}
            disabled={disabled}
            value={value}
            onChange={(val) => this.postToken(val ? "keep" : "cancel")}
          />
        </div>
        { tb && uid && lastAction === "keep" ?
          this.renderTextbox(tb, uid) : null }
      </div>;
    }

    return <div className={this.state.error ? "empty" : ""}>
      <div className="placeholder" />
      <div className="placeholder" />
      <div className="placeholder" />
    </div>;
  }

  getValue(tb: ApiT.TimebombState) { // True = confirmed
    if (hasTag("Stage1", tb)) {
      switch (this.state.lastAction) {
        case "keep":
          return true;
        case "cancel":
          return false;
        default:
          return null;
      }
    }

    else if (hasTag("Stage2", tb)) {
      return tb[1] === "Event_confirmed";
    }

    // Stage 0 -> should not happen
    return null;
  }

  renderAlert(tb: ApiT.TimebombState) {
    if (hasTag("Stage1", tb)) {
      if (! this.state.lastAction) return null;
      return <div className="alert success">
        { this.state.lastAction === "keep" ?
          TimebombText.Stage1OffDescription(tb[1].confirm_by) :
          TimebombText.Stage1OnDescription(tb[1].confirm_by) }
      </div>;
    }

    else if (hasTag("Stage2", tb)) {
      return <div className="alert info">
        { tb[1] === "Event_confirmed" ?
          TimebombText.Stage2ConfirmedDescription() :
          TimebombText.Stage2CancelledDescription() }
      </div>;
    }

    // Stage 0 -> should not be possible
    return null;
  }

  renderTextbox(tb: ApiT.TimebombState, uid: string) {
    // Only render textbox for stage1 and after
    if (hasTag("Stage1", tb)) {
      let contrib = tb[1].contributors.find((c) => c.uid === uid);
      let value = this.state.lastBlurb || (contrib && contrib.blurb) || "";
      return delay({
        ref: (c) => this._textbox = c,
        value,
        onChange: (v) => this.postToken("keep", v),
        component: (p) => <textarea
          placeholder={TimebombText.BlurbPlaceholder}
          value={p.value}
          onChange={(e) => p.onChange(e.target.value)}
        />
      });
    }

    return null;
  }

  renderDone() {
    // Render done button if stage 1, else render close button
    let event = this.state.event;
    if (event && event.timebomb && hasTag("Stage1", event.timebomb)) {
      return <button
          className="cta primary"
          disabled={this.state.busy}
          onClick={this.complete}>
        <Icon type="done">
          { CommonText.Done }
        </Icon>
      </button>;
    }
    return this.renderClose();
  }

  renderClose() {
    return <button
        className="cta secondary"
        disabled={this.state.busy}
        onClick={this.props.onDone}>
      <Icon type="close">
        { CommonText.Close }
      </Icon>
    </button>;
  }

  renderSuccess() {
    return <div>
      <SuccessMark>
        <p>
          { CommonText.Success }<br />
          <a onClick={() => this.setState({ success: false })}>
            { CommonText.EditResponse }
          </a>
        </p>
      </SuccessMark>
      { this.renderClose() }
    </div>;
  }
}

export default EventLanding;