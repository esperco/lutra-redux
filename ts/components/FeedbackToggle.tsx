/*
  Toggle for enabling feedback requests for an event
*/

require("less/components/_feedback-toggle.less");
import * as React from "react";
import * as moment from "moment";
import CheckboxItem from "./CheckboxItem";
import * as ApiT from "../lib/apiT";
import * as Text from "../text/feedback";

export interface Props {
  event: ApiT.GenericCalendarEvent;
  onToggle: (val: boolean) => void;
}

export const FeedbackToggle = ({ event, onToggle }: Props) => {
  let active = [
    event.feedback_pref,
    event.recurring_feedback_pref,
    event.global_feedback_pref
  ].find((v) => typeof v !== "undefined")

  // TODO -- adjust so we get this from server (end time is not always exactly
  // before current end of event)
  let disabled = moment(event.end).isBefore(new Date());

  return <div className="feedback-toggle">
    <CheckboxItem
      inputProps={{ disabled }}
      checked={!!active}
      onChange={onToggle}
    >
      { Text.FeedbackOn }
    </CheckboxItem>
  </div>;
}

export default FeedbackToggle;