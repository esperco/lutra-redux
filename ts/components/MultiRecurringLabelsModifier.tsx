/*
  Same as recurring label modifer, but for multiple events
*/

import * as React from "react";
import * as ApiT from "../lib/apiT";
import { useRecurringLabels } from "../lib/event-labels";
import * as Text from "../text/labels";

export interface Props {
  events: ApiT.GenericCalendarEvent[];
}

export const MultiRecurringLabelsModifier = ({ events }: Props) => {
  return !!events.find((e) => useRecurringLabels(e)) ?
    <div className="recurring-labels alert info">
      { Text.MultiRecurringLabelsDescription }
    </div> : null;
}

export default MultiRecurringLabelsModifier;
