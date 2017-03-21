/*
  Component for posting timebomb tokens to server.
*/
require("less/components/_event-landing.less");
import * as React from "react";
import * as classNames from "classnames";
import DataStatus from "../components/DataStatus";
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
  actionOnMount: TokenAction;
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

  // Event returned by token call, if any
  event?: ApiT.GenericCalendarEvent;
}

export class EventLanding extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      busy: false,
    };
  }

  // Normally, triggering API calls here isn't great form but we're
  // trying to avoid the overhead of using something ike Redux here.
  componentDidMount() {
    let action = this.props.actionOnMount;
    this.postToken(action, true);
    this.props.Svcs.Analytics.page(location.pathname, { action });
  }

  postToken(action: TokenAction, init=false) {
    this.setState({ busy: true, error: undefined, lastAction: action });
    this.props.Svcs.Api.postToken(this.props.tokens[action]).then(

      // Save event to React state if applicable
      (val) => {
        if (val === "Invalid_token" || val === "Expired_token") {
          this.setState({ busy: false, error: val });
          return;
        }

        else if (
          (action === "keep" &&
           hasTag("Confirm_timebomb_event", val.token_value)) ||
          (action === "cancel" &&
           hasTag("Unconfirm_timebomb_event", val.token_value))
        ) {
          let info = val.token_value[1];
          let { event, confirm_uid } = info;
          this.setState({
            busy: false, event,
            error: event ? undefined : "No_event"
          });
          if (init && confirm_uid) {
            this.props.Svcs.Analytics.identifyUID(confirm_uid);
          }
        }

        else {
          this.setState({ busy: false, error: "Other" });
          Log.e("Wrong token", val.token_value);
        }
      },

      // Unknown failure
      (err) => {
        this.setState({ busy: false, error: "Other" });
        Log.e(err);
      }
    );
  }

  render() {
    return <div className="event-landing">
      { this.renderError() }
      { this.renderDataStatus() }
      { this.renderEvent() }
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
            onChange={(val) => this.postToken(val ? "cancel" : "keep")}
          />
        </div>
      </div>;
    }

    return <div className={this.state.error ? "empty" : ""}>
      <div className="placeholder" />
      <div className="placeholder" />
      <div className="placeholder" />
    </div>;
  }

  getValue(tb: ApiT.TimebombState) { // True = active
    if (hasTag("Stage1", tb)) {
      return this.state.lastAction === "cancel";
    }

    else if (hasTag("Stage2", tb)) {
      return tb[1] === "Event_canceled";
    }

    // Stage 0 -> should not happen
    return false;
  }

  renderAlert(tb: ApiT.TimebombState) {
    if (hasTag("Stage1", tb)) {
      return <div className="alert success">
        { this.state.lastAction && this.state.lastAction === "keep" ?
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
}

export default EventLanding;