/*
  Buttons for rating tags -- only show up after star rating set
*/

require("less/components/_feedback-tags.less");
import * as React from "react";
import * as classNames from "classnames";
import * as ApiT from "../lib/apiT";
import { POSITIVE_FEEDBACK_THRESHOLD } from "../lib/feedback";
import * as Text from "../text/feedback";

export interface Props {
  value: ApiT.GuestEventFeedback;
  onChange: <K extends keyof ApiT.EventFeedback>(
    val: ApiT.GuestEventFeedbackPatch<K>
  ) => void;
}

export const FeedbackTags = (props: Props) => {
  if (! props.value.stars) {
    return null;
  }

  // Show positive buttons
  if (props.value.stars >= POSITIVE_FEEDBACK_THRESHOLD) {
    return <div className="feedback-tags">
      <label>{ Text.PositiveButtonLabel }</label>
      <div>
        <PosFeedbackButton name="agenda" {...props} />
        <PosFeedbackButton name="on_time" {...props} />
        <PosFeedbackButton name="good_time_mgmt" {...props} />
        <PosFeedbackButton name="contributed" {...props} />
        <PosFeedbackButton name="action_items" {...props} />
      </div>
    </div>;
  }

  // Show "room for improvement" buttons
  return <div className="feedback-tags">
    <label>{ Text.NegativeButtonLabel }</label>
    <div>
      <NegFeedbackButton name="agenda" {...props} />
      <NegFeedbackButton name="on_time" {...props} />
      <NegFeedbackButton name="good_time_mgmt" {...props} />
      <NegFeedbackButton name="presence_useful" {...props} />
      <NegFeedbackButton name="action_items" {...props} />
    </div>
  </div>;
};


type TagName = keyof (typeof Text.PostiveTags);

interface ButtonProps extends Props {
  name: TagName;
}

const PosFeedbackButton = ({ name, value, onChange }: ButtonProps) => {
  let active = value[name] === true;
  return <button
    onClick={() => onChange({
      [name]: active ? null : true
    } as { agenda: null|true } /* Typecast because pick is weird */ )}
    className={classNames("secondary", { active })}
  >
    { Text.PostiveTags[name] }
  </button>;
}

const NegFeedbackButton = ({ name, value, onChange }: ButtonProps) => {
  let active = value[name] === false;
  return <button
    onClick={() => onChange({
      [name]: active ? null : false
    } as { agenda: null|false } /* Typecast because pick is weird */ )}
    className={classNames("secondary", { active })}
  >
    { Text.NegativeTags[name] }
  </button>;
}

export default FeedbackTags;