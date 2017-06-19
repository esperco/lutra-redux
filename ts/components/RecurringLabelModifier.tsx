/*
  Recurring label modifier
*/

import * as React from "react";
import * as ApiT from "../lib/apiT";
import { useRecurringLabels } from "../lib/event-labels";
import * as Text from "../text/labels";

export interface Props {
  event: ApiT.GenericCalendarEvent;
  onForceInstance: () => void;
}

export const RecurringLabelModifier =
  ({ event, onForceInstance }: Props) => event.recurring_event_id ?
    <div className="recurring-labels alert info">
      { useRecurringLabels(event) ?
        <span>
          <span className="description">
            { Text.RecurringLabelsDescription }
          </span>
          <button onClick={() => onForceInstance()}>
            { Text.SwitchToInstanceLabels }
          </button>
        </span> :
        Text.InstanceLabelsDescription }
    </div> : null;

export default RecurringLabelModifier;
