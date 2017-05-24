/*
  Component for posting timebomb tokens to server.
*/
require("less/components/_event-landing.less");
import * as React from "react";
import * as classNames from "classnames";
import DataStatus from "../components/DataStatus";
import Textbox from "../components/AutoTextarea";
import { EventInfo } from "../components/EventList";
import { BaseTimebombToggle } from "../components/TimebombToggle";
import { ApiSvc } from "../lib/api";
import { AnalyticsSvc } from "../lib/analytics";
import * as ApiT from "../lib/apiT";
import * as Log from "../lib/log";
import { NavSvc } from "../lib/routing";
import { hasTag } from "../lib/util";
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

  // Event returned by token call, if any
  event?: ApiT.GenericCalendarEvent;

  // UID of user, if any
  uid?: string;
}

export class EventLanding extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      busy: false,
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
    let token = this.props.tokens[action];
    let { Api } = this.props.Svcs;
    let resp: ApiT.TokenResponse|"Invalid_token"|"Expired_token";
    try {
      resp = await (action === "keep" ?
        Api.postConfirmToken(token, blurb ? { blurb } : {}) :
        Api.postToken(token));
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

  render() {
    return <div className="event-landing">
      { this.renderError() }
      { this.renderEvent() }
      { this.renderDataStatus() }
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
          { tb && uid && lastAction === "keep" ?
            this.renderTextbox(tb, uid) : null }
        </div>
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
      return <Textbox
        value={value}
        placeholder={TimebombText.BlurbPlaceholder}
        onChange={(v) => this.postToken("keep", v)}
      />;
    }

    return null;
  }
}

export default EventLanding;