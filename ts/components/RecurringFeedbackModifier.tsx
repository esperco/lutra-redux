/*
  Recurring feedback modifier - switch to instance labeling of feedback
*/

import * as React from "react";
import * as ApiT from "../lib/apiT";
import { useRecurringPref, feedbackPref, canTogglePref } from "../lib/feedback";
import * as Text from "../text/feedback";

export interface Props {
  event: ApiT.GenericCalendarEvent;
  onForceInstance: () => void;
}

export const RecurringFeedbackModifier = ({ event, onForceInstance }: Props) =>
{
  if (! canTogglePref(event)) return null;

  let pref = feedbackPref(event);
  return event.recurring_event_id ?
    <div className="recurrence-info alert info">
      { useRecurringPref(event) ?
        <span>
          <span className="description">
            { Text.RecurringDescription(pref) }
          </span>
          <button onClick={() => onForceInstance()}>
            { Text.SwitchToInstance}
          </button>
        </span> :
        Text.InstanceDescription(pref) }
    </div> : null;
}

export default RecurringFeedbackModifier;
