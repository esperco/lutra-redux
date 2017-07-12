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
  value: Partial<ApiT.EventFeedback>;
  onChange: (val: Partial<ApiT.EventFeedback>) => void;
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
      <NegFeedbackButton name="no_agenda" {...props} />
      <NegFeedbackButton name="started_late" {...props} />
      <NegFeedbackButton name="poor_time_mgmt" {...props} />
      <NegFeedbackButton name="guest_not_needed" {...props} />
      <NegFeedbackButton name="no_action_items" {...props} />
    </div>
  </div>;
};


interface PosButtonProps extends Props {
  name: keyof ApiT.PositiveFeedbackTags;
}

const PosFeedbackButton = ({ name, value, onChange }: PosButtonProps) => {
  let active = value[name] === true;
  return <button
    onClick={() => onChange({ [name]: !active })}
    className={classNames("secondary", { active })}
  >
    { Text.PostiveTags[name] }
  </button>;
}

interface NegButtonProps extends Props {
  name: keyof ApiT.NegativeFeedbackTags;
}

const NegFeedbackButton = ({ name, value, onChange }: NegButtonProps) => {
  let active = value[name] === true;
  return <button
    onClick={() => onChange({ [name]: !active })}
    className={classNames("secondary", { active })}
  >
    { Text.NegativeTags[name] }
  </button>;
}

export default FeedbackTags;