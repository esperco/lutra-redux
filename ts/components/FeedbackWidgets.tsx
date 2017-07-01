/*
  UI for different parts of event feedback
*/
import * as React from "react";
import CheckboxItem from "./CheckboxItem";
import delay, { DelayedControl } from "../components/DelayedControl";
import { randomString } from "../lib/util";
import * as Text from "../text/feedback";
import FeedbackTags, { Props } from "./FeedbackTags";
import StarRating from "./StarRating";

export class FeedbackWidgets extends React.Component<Props, {}> {
  _id: string = randomString();
  _textbox: DelayedControl<string>|null = null;

  render() {
    let { value, onChange } = this.props;
    return <div className="feedback-widgets">
      <label>{ Text.StarRatingsLabel }</label>
      <div className="description">
        { Text.StarRatingsDescription }
      </div>
      <StarRating
        value={value.stars}
        onChange={(stars) => onChange({ stars })}
      />
      <FeedbackTags value={value} onChange={onChange} />

      { value.stars ? this.renderTextbox() : null }

      <CheckboxItem
        onChange={(is_organizer) => onChange({ is_organizer })}
        checked={!!value.is_organizer}
      >
        { Text.IsOrganizer }
      </CheckboxItem>

      <CheckboxItem
        onChange={(didnt_attend) => onChange({ didnt_attend })}
        checked={!!value.didnt_attend}
      >
        { Text.DidntAttend }
      </CheckboxItem>
    </div>
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