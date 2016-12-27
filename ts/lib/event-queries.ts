/*
  Representation of filter options when querying events
*/
import * as _ from "lodash";
import * as jsonStringify from "json-stable-stringify";
import * as ApiT from "./apiT";
import { AllSomeNone } from "./asn";
import { compactObject } from "./util";

const DEFAULT_LABELS: AllSomeNone = { all: true };

export interface QueryFilter {
  labels?: AllSomeNone;
  contains?: string;       // Event title or description
  participants?: string[]; // Name or email
  minCost?: number;        // 1-5
}

// Normalizes QueryFilter to remove default options
export function reduce(q: QueryFilter): QueryFilter {
  return compactObject({
    ...q,
    labels: _.isEqual(q.labels, DEFAULT_LABELS) ? undefined : q.labels,
    contains: (q.contains && q.contains.trim()) || undefined,
    minCost: (q.minCost || 1) > 1 ? q.minCost : undefined
  });
}

// Stringify for use as a key in a map
export function stringify(q: QueryFilter): string {
  return jsonStringify(reduce(q));
}

// Returns options for
export function toAPI(start: Date, end: Date, q?: QueryFilter)
  : ApiT.CalendarRequest
{
  q = reduce(q || {});

  // These props can be copied to ret more or less eactly
  let { contains, minCost: min_cost, participants } = q;

  let ret: ApiT.CalendarRequest = {
    window_start: start.toISOString(),
    window_end: end.toISOString(),
    contains, min_cost, participants
  };

  // Labels need special formatting
  let labelASN = q.labels || DEFAULT_LABELS; // Default
  if (!(labelASN.all && labelASN.none)) {
    // Implies don't show unlabeled
    if (labelASN.all) {
      ret.labels = ["Not", "No_label" as "No_label"];
    }

    // Implies some combination of some and
    else {
      let labels: (["Label", string]|"No_label")[] = _.flatMap(
        labelASN.some || {},
          (v, k) => v ? [["Label", k] as ["Label", string]] : []
        );

      if (labelASN.none) {
        labels.push("No_label");
      }

      ret.labels = ["Or", labels];
    }
  }

  return compactObject(ret);
}
