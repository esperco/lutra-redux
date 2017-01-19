/*
  Event label helpers
*/
import * as _ from "lodash";
import * as ApiT from "./apiT";
import { ColorMap, getColorForMap } from "./colors";
import { ChoiceSet } from "../lib/util";

const LABEL_FILTER_LIMIT = 10;

// ChoiceSet specific to labels
export class LabelSet extends ChoiceSet<ApiT.LabelInfo> {
  /*
    Maps normalized hashtags to (most recent) normalized form of label.
    We keep this map so we can easily convert hashtags to normal labels
    while preserving any references to the original normalized hashtag
    that might be floating around.
  */
  _hashtags: { [normalized: string]: string; };

  constructor(labels: ApiT.LabelInfo[]) {
    super([]);
    this._hashtags = {};
    this.push(...labels);
  }

  getByKey(key: string) {
    return super.getByKey(key) ||
           super.getByKey(this._hashtags[key]);
  }

  hasKey(key: string) {
    return super.hasKey(key) ||
           super.hasKey(this._hashtags[key]);
  }

  push(...labels: ApiT.LabelInfo[]) {
    _.each(labels, (label) => {
      let key = this._keyFn(label);
      let hashKey = normalizeHashtag(label.normalized);

      // Replace existing hash
      if (key !== hashKey && super.hasKey(hashKey)) {
        this._hashtags[hashKey] = key;
        delete this.hash[hashKey];
      }

      // New key altogether, append to end
      else if (! this.hasKey(key)) {
        this.list.push(key);
      }

      this.hash[key] = label;
    });
  }
}

/*
  Takes team or group labels, plus a list of events -- returns a list of labels
  plus totals for labels
*/
export function getLabelCounts(
  baseLabels: LabelSet,
  events: ApiT.GenericCalendarEvent[]
): {
  labels: LabelSet;
  selected: LabelSet;
  counts: Record<string, number>; // Normalized => count
} {
  // Map for faster lookup. Ret preserves order.
  let counts: {[norm: string]: number} = {};
  let labels = baseLabels.clone();
  let selected = new LabelSet([]);

  // Prepopulate with base group or team labels
  labels.forEach((l) => {
    counts[l.normalized] = 0;
  });

  // Iterate through each event
  _.each(events, (ev) => {
    let eventLabels = getLabels(ev);
    _.each(eventLabels, (l) => {
      counts[l.normalized] = (counts[l.normalized] || 0) + 1;
      labels.push(l);
      selected.push(l);
    });
  });

  return { labels, selected, counts };
}

/*
  Returns three OrderedSets -- one with all the labels, one with labels
  that are selected in any event, and one with partially selected labels
  (labels selected in at least one event but not all the events)
*/
export function getLabelPartials(
  baseLabels: LabelSet,
  events: ApiT.GenericCalendarEvent[]
): {
  labels: LabelSet;
  selected: LabelSet;
  partial: LabelSet;
} {
  let { labels, selected, counts } = getLabelCounts(baseLabels, events);
  let partial = selected.filter((k) => counts[k.normalized] < events.length);
  return {
    labels,
    selected,
    partial
  };
}

/*
  Get labels for a single event -- includes logic for handling predicted
  labels and hashtags.

  Can optionally opt-opt of hashtags (because we need to make separate
  API calls for them).
*/
export function getLabels(
  event: ApiT.GenericCalendarEvent,
  incHashtag = true
): ApiT.LabelInfo[] {
  return event.labels || [];
}


let labelMap: ColorMap = {};
export function newLabelColor(normalized: string) {
  return getColorForMap(normalized, labelMap);
}

export function resetColors() {
  labelMap = {};
}


/*
  When to apply labels to a recurring master rather than the instance
*/
export function useRecurringLabels(event: ApiT.GenericCalendarEvent)
: event is ApiT.GenericCalendarEvent & {
  recurring_event_id: string
} {
  return !!event.recurring_event_id && (
    event.has_recurring_labels ||

    // No labls or predicted labels means no labels on instance, can
    // apply to recurring
    !event.labels ||
    !!event.labels_predicted
  );
}


/*
  For use with filter menu -- returns two-tuple of any label that matches
  filter string exactly, followed by any other labels that contain filter
*/
export function filter(
  labels: LabelSet,
  str: string,
  limit = LABEL_FILTER_LIMIT
): [ApiT.LabelInfo|undefined, ApiT.LabelInfo[]] {
  str = normalize(str);
  let filtered = labels.filter(
    (l) => _.includes(l.normalized, str),
    limit
  );
  let match = labels.getByKey(str);
  if (match && filtered.has(match)) {
    filtered = filtered.without(match);
  }
  return [match, filtered.toList()];
}


// Normalize label -- should match server
export function normalize(label: string) {
  return label.trim().toLowerCase();
}

/*
  Returns the normalized hashtag equivalent of a label. Returns
  "#hashtag" for "Hash Tag".
*/
export function normalizeHashtag(label: string) {
  return "#" + normalize(label).replace(/[^A-Za-z0-9]*/g, "");
}

/*
  New label -> create
*/
export function newLabel(original: string): ApiT.LabelInfo {
  let normalized = normalize(original);
  return {
    normalized, original,
    color: newLabelColor(normalize(original))
  }
}

/*
  Returns updated label list -- labels are always alphabetized based on
  normalization. Labels added to a list replace existing ones based on
  normalization.
*/
export function updateLabelList(labels: ApiT.LabelInfo[], update: {
  add?: ApiT.LabelInfo[];
  rm?: ApiT.LabelInfo[];
}): ApiT.LabelInfo[] {
  let labelSet = new LabelSet(labels);
  labelSet.pull(...(update.rm || []));
  labelSet.push(...(update.add || []));
  return _.sortBy(labelSet.toList(), (l) => l.normalized);
}
