/*
  UI for different parts of event feedback
*/
import * as React from "react";
import CheckboxItem from "./CheckboxItem";
import delay, { DelayedControl } from "../components/DelayedControl";
import Tooltip from "../components/Tooltip";
import { randomString } from "../lib/util";
import * as Text from "../text/feedback";
import FeedbackTags, { Props } from "./FeedbackTags";
import StarRating from "./StarRating";

export class FeedbackWidgets extends React.Component<Props, {}> {
  _id: string = randomString();
  _textbox: DelayedControl<string>|null = null;

  render() {
    let { value, onChange } = this.props;
    let disabled = !!(value.didnt_attend || value.is_organizer);
    return <div className="feedback-widgets">
      <label>{ Text.StarRatingsLabel }</label>
      <div className="description">
        { Text.StarRatingsDescription }
      </div>
      { this.renderStarRating(disabled) }
      { disabled ? null : <FeedbackTags value={value} onChange={onChange} /> }

      { value.stars && !disabled ? this.renderTextbox() : null }

      <CheckboxItem
        onChange={(is_organizer) => onChange({ is_organizer })}
        checked={!!value.is_organizer}
      >
        <Tooltip
          target={<span>{ Text.IsOrganizer }</span>}
          title={Text.IsOrganizerTooltip}
        />
      </CheckboxItem>

      <CheckboxItem
        onChange={(didnt_attend) => onChange({ didnt_attend })}
        checked={!!value.didnt_attend}
      >
        { Text.DidntAttend }
      </CheckboxItem>
    </div>
  }

  renderStarRating(disabled: boolean) {
    let { value, onChange } = this.props;
    let ret = <StarRating
      disabled={disabled}
      value={value.stars}
      onChange={(stars) => onChange({ stars })}
    />;

    if (disabled) {
      let title = value.didnt_attend ?
        Text.StarRatingsDisabledNotAttend :
        Text.StarRatingsDisabledOrganizer;
      return <Tooltip
        target={<div style={{display: "inline-block"}}>{ ret }</div>}
        title={title}
      />;
    }
    return ret;
  }

  renderTextbox() {
    let value = this.props.value.notes || "";
    return delay({
      ref: (c) => this._textbox = c,
      value,
      onChange: (x) => this.props.onChange({ notes: x.trim() }),
      component: (p) => <div>
        <label htmlFor={this._id}>{ Text.TextFeedbackLabel }</label>
        <textarea
          id={this._id}
          placeholder={Text.BlurbPlaceholder}
          value={p.value}
          onChange={(e) => p.onChange(e.target.value || "")}
        />
      </div>
    });
  }

  getVal() {
    if (this._textbox) {
      let notes = this._textbox.getAndClear().trim();
      return { notes };
    }
    return;
  }
}

export default FeedbackWidgets;