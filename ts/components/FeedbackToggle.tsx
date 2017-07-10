/*
  Toggle for enabling feedback requests for an event
*/

require("less/components/_feedback-toggle.less");
import * as React from "react";
import CheckboxItem from "./CheckboxItem";
import * as ApiT from "../lib/apiT";
import { feedbackPref, canTogglePref } from "../lib/feedback";
import * as Text from "../text/feedback";

export interface Props {
  event: ApiT.GenericCalendarEvent;
  onToggle: (val: boolean) => void;
}

export const FeedbackToggle = ({ event, onToggle }: Props) => {
  let active = feedbackPref(event);
  let disabled = !canTogglePref(event);

  return <div className="feedback-toggle">
    <CheckboxItem
      inputProps={{ disabled }}
      checked={active}
      onChange={onToggle}
    >
      { Text.FeedbackOn }
    </CheckboxItem>
  </div>;
}

export default FeedbackToggle;