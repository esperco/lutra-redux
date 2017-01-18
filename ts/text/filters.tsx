import * as _ from "lodash";
import * as React from "react";
import { Unlabeled } from "./labels";
import { LabelSet } from "../lib/event-labels";
import { QueryFilter } from "../lib/event-queries";

export function filterText(filter: QueryFilter, labels?: LabelSet) {
  let parts: string[] = [];

  if (filter.contains) {
    parts.push(filter.contains);
  }

  if (filter.minCost) {
    parts.push(_.repeat("$", filter.minCost));
  }

  if (filter.labels) {
    _.each(filter.labels.some || {}, (v, k) => {
      if (k) {
        if (labels && labels.hasKey(k)) {
          parts.push(labels.getByKey(k).original);
        } else {
          parts.push(k);
        }
      }
    });
    if (filter.labels.none) {
      parts.push(Unlabeled);
    }
  }

  _.each(filter.participant || [], (p) => parts.push(p));

  return <span>
    Filtering for { parts.join(", ") }
  </span>;
}

export const Reset = "Reset";