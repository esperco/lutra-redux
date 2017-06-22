/*
  Toggle for enabling feedback requests for an event
*/

require("less/components/_feedback-toggle.less");
import * as React from "react";
import CheckboxItem from "./CheckboxItem";
import * as ApiT from "../lib/apiT";
import * as Text from "../text/feedback";

export interface Props {
  event: ApiT.GenericCalendarEvent;
  onToggle: (val: boolean) => void;
}

// TODO, pending API hookup
export const FeedbackToggle = (p: Props) => {
  let active = false;
  let disabled = false;
  return <div className="feedback-toggle">
    <CheckboxItem
      inputProps={{ disabled }}
      checked={!!active}
      onChange={p.onToggle}
    >
      { Text.FeedbackOn }
    </CheckboxItem>
  </div>;
}

export default FeedbackToggle;