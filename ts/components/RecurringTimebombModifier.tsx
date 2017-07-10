/*
  Recurring timebomb modifier - switch to instance labeling of agenda
*/

import * as React from "react";
import * as ApiT from "../lib/apiT";
import { useRecurringPref, canTogglePref, timebombPref } from "../lib/timebomb";
import * as Text from "../text/timebomb";

export interface Props {
  event: ApiT.GenericCalendarEvent;
  onForceInstance: () => void;
}

export const RecurringTimebombModifier = ({ event, onForceInstance }: Props) =>
{
  if (! canTogglePref(event)) return null;

  let pref = timebombPref(event);
  return event.recurring_event_id ?
    <div className="recurrence-info alert info">
      { useRecurringPref(event) ?
        <span>
          <span className="description">
            { Text.RecurringDescription(pref) }
          </span>
          <button onClick={() => onForceInstance()}>
            { Text.SwitchToInstance }
          </button>
        </span> :
        Text.InstanceDescription(pref) }
    </div> : null;
}

export default RecurringTimebombModifier;
