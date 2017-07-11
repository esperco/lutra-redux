/*
  Component for posting timebomb tokens to server.
*/
require("less/components/_event-landing.less");
import * as React from "react";
import DataStatus from "../components/DataStatus";
import EventEditor from "../components/EventEditor";
import FeedbackWidgets from "../components/FeedbackWidgets";
import Icon from "../components/Icon";
import SuccessMark from "../components/SuccessMark";
import { ApiSvc } from "../lib/api";
import { AnalyticsSvc } from "../lib/analytics";
import * as ApiT from "../lib/apiT";
import { merge, toPick } from "../lib/feedback";
import * as Log from "../lib/log";
import { wrapMerge } from "../lib/queue";
import { NavSvc } from "../lib/routing";
import { hasTag } from "../lib/util";
import * as CommonText from "../text/common";
import * as ErrorText from "../text/error-text";
import * as FeedbackText from "../text/feedback";

export interface Props {
  actionOnMount?: Partial<ApiT.EventFeedback>;
  onDone: () => void;
  token: string;
  Svcs: ApiSvc & NavSvc & AnalyticsSvc;
}

type TokenError = "Invalid_token"|"Expired_token"|"Other";

interface State {
  // Busy posting token?
  busy: boolean;

  // Error posting token?
  error?: TokenError;

  // Show success page?
  success?: boolean;

  // Model for feedback, response for posted token
  model?: {
    uid: string;
    event: ApiT.GenericCalendarEvent;
    feedback: ApiT.GuestEventFeedback;
  };
}

export class RatingsLanding extends React.Component<Props, State> {
  _widgets: FeedbackWidgets|null = null;

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
    let action = this.props.actionOnMount || {};
    this.postInitToken(action);
    this.props.Svcs.Analytics.page(location.pathname, { action });
  }

  // Special identification handling for inital token post
  async postInitToken(action: Partial<ApiT.EventFeedback>) {
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
  async postToken(
    action: Partial<ApiT.EventFeedback>
  ): Promise<ApiT.EventForGuest|void> {
    // Clean up action
    let { model } = this.state;

    // Busy indicator - optimistic UI updates
    this.setState({
      busy: true, error: undefined,
      model: model ? {
        ...model,
        feedback: merge(model.feedback, action)
      } : undefined
    });

    /*
      Call appropriate API. Wrap API call in try block so we can gracefully
      show an error message.
    */
    let resp: ApiT.TokenResponse|"Invalid_token"|"Expired_token";
    try {
      // Post merged action to guarantee state clearing
      resp = await this.postTokenAPI(action);
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

    // Verify token has expected value
    if (hasTag("Feedback", resp.token_value)) {
      let info = resp.token_value[1];
      if (info.event) {
        let model = {
          uid: info.uid,
          event: info.event,
          feedback: info.feedback || {
            uid: info.uid,
            is_organizer: false,
            didnt_attend: false
          }
        };
        this.setState({ busy: false, model });
        return info;
      }
    }

    // If we get here, we receive an unexpected token response
    this.setState({ busy: false, error: "Other" });
    Log.e("Wrong token", resp.token_value);
  }

  postTokenAPI = wrapMerge((action: Partial<ApiT.EventFeedback>) => {
    let { token, Svcs } = this.props;
    let { Api } = Svcs;
    return Api.postRatingsToken(token, toPick(action));
  });

  complete = async () => {
    if (this._widgets) {
      let val = this._widgets.getVal();
      if (val) {
        await this.postToken(val);
      }
    }
    this.setState({ success: true });
  }

  render() {
    if (this.state.success) {
      return <div className="event-landing">
        { this.renderSuccess() }
      </div>;
    }

    if (this.state.error) {
      return <div className="event-landing">
        { this.renderError(this.state.error) }
        <div className="empty">
          <div className="placeholder" />
          <div className="placeholder" />
          <div className="placeholder" />
        </div>
        { this.renderClose() }
      </div>;
    }

    return <div className="event-landing">
      { this.renderEvent() }
      { this.renderDataStatus() }
    </div>;
  }

  renderError(error: TokenError) {
    let msg: string|JSX.Element|null = null;
    switch(error) {
      case "Invalid_token":
      case "Expired_token":
        msg = ErrorText.getText(403, { tag: error });
        break;
      case "Other":
        msg = ErrorText.GenericErrorMsg;
        break;
    }

    return <div className="alert danger">
      { msg }
    </div>;
  }

  renderDataStatus() {
    return <DataStatus apiCalls={this.state.busy ? {token: false} : {}} />;
  }

  renderEvent() {
    if (this.state.model) {
      let { event, feedback } = this.state.model;
      return <div>
        <div className="lead-in">{ FeedbackText.LandingQ }</div>
        <EventEditor event={event} showDescription={false}>
          <FeedbackWidgets
            value={feedback}
            onChange={(v) => this.postToken(v)}
          />
        </EventEditor>
        <button
          className="cta primary"
          disabled={this.state.busy}
          onClick={this.complete}
        >
          <Icon type="done">
            { CommonText.Done }
          </Icon>
        </button>
      </div>;
    }

    return <div>
      <div className="placeholder" />
      <div className="placeholder" />
      <div className="placeholder" />
    </div>;
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

export default RatingsLanding;