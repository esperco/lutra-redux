import * as _ from "lodash";
import * as React from "react";
import * as moment from "moment";
import * as classNames from "classnames";
import * as ApiT from "../lib/apiT";
import { useRecurringLabels } from "../lib/event-labels";
import fmtText from "../lib/fmt-text";
import * as CommonText from "../text/common";
import * as EventText from "../text/events";
import * as LabelText from "../text/labels";
import { ok, ready, StoreData } from "../states/data-status";
import { GroupMembers } from "../states/groups";
import Dropdown from "./Dropdown";
import Icon from "./Icon";
import LabelList from "./LabelList";
import Tooltip from "./Tooltip";

interface Props {
  event: StoreData<ApiT.GenericCalendarEvent>|undefined;
  members: StoreData<GroupMembers>|undefined;
  labels: ApiT.LabelInfo[];
  loginDetails: ApiT.LoginResponse|undefined;
  onChange: (x: ApiT.LabelInfo, active: boolean) => void;
  onForceInstance: () => void;
  onHide: (hidden: boolean) => void;
  onCommentPost: (eventId: string, text: string) => Promise<any>;
  onCommentDelete: (eventId: string, commentId: string) => void;
}

export class EventEditor extends React.Component<Props, {}> {
  render() {
    if (! ok(this.props.event)) {
      return <div className="event-editor">
        <h3>{ EventText.NotFound }</h3>
      </div>;
    }

    if (this.props.event === "FETCHING") {
      return <div className="event-editor">
        <div className="placeholder" />
        <div className="placeholder" />
        <div className="placeholder" />
      </div>;
    }

    let event = this.props.event;
    let mStart = moment(event.start);
    let mEnd = moment(event.end);
    return <div className={classNames("event-editor", {
      hidden: event.hidden
    })}>
      <Dropdown
        toggle={<button className="dropdown-toggle">
          <Icon type="options" />
        </button>}

        menu={<div className="dropdown-menu"><div className="menu">
          <button className="hide-btn"
                  onClick={() => this.props.onHide(!event.hidden)}>
            <span>{ event.hidden ? CommonText.Show : CommonText.Hide }</span>
            <div className="description">
              { event.hidden ?
                EventText.ShowDescription :
                EventText.HideDescription }
            </div>
          </button>
        </div></div>}
      />

      <h3>{ event.title ||
        <span className="no-title">{ EventText.NoTitle }</span>
      }</h3>

      <div className="time">
        <span className="start">
          { mStart.format("MMM D, LT") }
        </span>{" to "}<span className="end">
          { mStart.isSame(mEnd, 'day') ?
            mEnd.format("LT") : mEnd.format("LT") }
        </span>{" "}

        { event.recurring_event_id ?
          <Tooltip
            target={<span className="recurring">
              <Icon type="repeat" />
            </span>}
            title={EventText.Recurring}
          /> : null }
      </div>

      { event.location ?
        <div className="location">
          <Icon type="location" />
          {event.location}
        </div> : null }

      { event.description ?
        <div className="description">
          { fmtText(event.description) }
        </div> : null }

      <LabelList
        labels={this.props.labels}
        events={[event]}
        onChange={(ids, label, active) => this.props.onChange(label, active)}
      />

      { event.recurring_event_id ?
        <div className="recurring-labels alert info">
          { useRecurringLabels(event) ?
            <span>
              <span className="description">
                { LabelText.RecurringLabelsDescription }
              </span>
              <button onClick={this.props.onForceInstance}>
                { LabelText.SwitchToInstanceLabels }
              </button>
            </span> :
            LabelText.InstanceLabelsDescription }
        </div> : null }

      <GuestList guests={event.guests} />

      <CommentList eventId={event.id}
                   comments={event.comments}
                   members={this.props.members}
                   loginDetails={this.props.loginDetails}
                   onCommentPost={this.props.onCommentPost}
                   onCommentDelete={this.props.onCommentDelete} />
    </div>
  }
}

export class GuestList extends React.Component<{
  guests?: ApiT.Attendee[]
}, {}> {
  render() {
    if (_.isEmpty(this.props.guests)) {
      return null;
    }

    return <div className="guest-list">
      <h4>{ EventText.Attendees }</h4>
      { _.map(this.props.guests || [], (g, i) => this.renderGuest(g, i)) }
    </div>;
  }

  renderGuest(guest: ApiT.Attendee, index: number) {
    return <div key={guest.email || index}
    className={classNames("guest", {
      declined: guest.response === "Declined"
    })}>
      <Tooltip
          target={<span className="name">
            { guest.display_name || guest.email }
          </span>}
          title={guest.email}
      />
      <span className="status">
        { EventText.attendeeStatus(guest.response) }
      </span>
    </div>;
  }
}

interface CommentProps {
  eventId: string;
  comments: ApiT.GroupEventComment[];
  members: StoreData<GroupMembers>|undefined;
  loginDetails: ApiT.LoginResponse|undefined;
  onCommentPost: (eventId: string, text: string) => Promise<any>;
  onCommentDelete: (eventId: string, commentId: string) => void;
}

export class CommentList extends React.Component<CommentProps, {
  pushing: boolean;
}> {
  _textarea: HTMLTextAreaElement;

  constructor(props: CommentProps) {
    super(props);

    this.state = {
      pushing: false
    };
  }

  componentWillReceiveProps() {
    this.setState({
      pushing: false
    });
  }

  render() {
    return <div className="panel">
      <h4>{ EventText.Comments }</h4>
      <div className="comment-section">
        <div>{ _.isEmpty(this.props.comments) ?
          <div className="no-content">{ EventText.NoComment }</div> :
          _.map(this.props.comments, (c, i) => this.renderComment(c, i))
        }</div>

        <div>
          <textarea placeholder={ EventText.CommentPlaceholder }
                    ref={(c) => this._textarea = c}
                    disabled={this.state.pushing} />
        </div>

        <div>
          <button className="primary" onClick={(e) => this.validateInput(e)}>
            Submit
          </button>
        </div>
      </div>
    </div>;
  }

  validateInput(e: React.MouseEvent<HTMLButtonElement>) {
    let text = this._textarea.value;
    if (!text || _.isEmpty(text) || this.state.pushing) return;

    this.props.onCommentPost(this.props.eventId, text).then(
      () => this._textarea.value = "");

    this.setState({
      pushing: true
    });
  }

  renderComment(comment: ApiT.GroupEventComment, index: number) {
    let showDelete = ready(this.props.loginDetails)
      && (this.props.loginDetails.is_admin ||
          this.props.loginDetails.uid === comment.author);

    return <div key={comment.id || `comment-${index}`} className="comment">
      { showDelete ?
        <button className="comment-delete" onClick={
          () => this.props.onCommentDelete(this.props.eventId, comment.id)
        }>
          <Icon type="remove" />
        </button> : null
      }
      <h5>{ this.getAuthorName(comment.author) }</h5>
      <div className="time">{ moment(comment.created).fromNow() }</div>
      { fmtText(comment.text) }
    </div>;
  }

  getAuthorName(uid: string) {
    if (!ready(this.props.members)) return EventText.DefaultUsername;

    let { group_individuals, group_teams } = this.props.members;
    let gim = _.find(group_individuals, (i) => i.uid === uid);
    if (! gim) return EventText.DefaultUsername;

    let team = _.find(group_teams, (t) => gim && t.email === gim.email);
    if (!team) return gim.email;

    return team.name;
  }
}

export default EventEditor;
