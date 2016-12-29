/*
  Event label helpers
*/
import * as _ from "lodash";
import * as ApiT from "./apiT";
import { ColorMap, getColorForMap } from "./colors";
import { ChoiceSet } from "../lib/util";

// ChoiceSet specific to labels
export class LabelSet extends ChoiceSet<ApiT.LabelInfo> {}

const PREDICTED_LABEL_PERCENT_CUTOFF = 0.5;

/*
  Takes team or group labels, plus a list of events -- returns a list of labels
  plus totals for labels
*/
export function getLabelCounts(
  baseLabels: ApiT.LabelInfo[],
  events: ApiT.GenericCalendarEvent[]
): {
  labels: LabelSet;
  selected: LabelSet;
  counts: Record<string, number>; // Normalized => count
} {
  // Map for faster lookup. Ret preserves order.
  let counts: {[norm: string]: number} = {};
  let labels = new LabelSet(baseLabels);
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
  baseLabels: ApiT.LabelInfo[],
  events: ApiT.GenericCalendarEvent[]
): {
  labels: LabelSet;
  selected: LabelSet;
  partial: LabelSet;
} {
  let { labels, selected, counts } = getLabelCounts(baseLabels, events);
  let partial = new LabelSet(
    selected.filter((k) => counts[k.normalized] < events.length)
  );

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
  // Hashtags
  let hashtags = incHashtag ? _(event.hashtags)
    .filter((h) => h.approved !== false)
    .map((h) => h.label || ({
      ...h.hashtag, color: newLabelColor(h.hashtag.normalized)
    }))
    .value() : [];

  // Default to user-specified labels if they exist -- union with hashtags
  if (event.labels) {
    return _(event.labels).unionBy(hashtags, (l) => l.normalized).value();
  }

  // Else hashtags
  if (! _.isEmpty(event.hashtags)) {
    return hashtags;
  }

  // Else predictions
  if (event.predicted_labels) {
    return _(event.predicted_labels)
      .filter((l) => l.score > PREDICTED_LABEL_PERCENT_CUTOFF)
      .map((l) => l.label)
      .value();
  }

  return [];
}


let labelMap: ColorMap = {};
export function newLabelColor(normalized: string) {
  return getColorForMap(normalized, labelMap);
}

export function resetColors() {
  labelMap = {};
}


/* Label Filtering */

export function filter<T extends ApiT.LabelInfo>(
  label: T, filter: string
): boolean {
  filter = normalize(filter);
  return _.includes(label.normalized, filter);
}
export function match<T extends ApiT.LabelInfo>(
  label: T, filter: string
): boolean {
  filter = normalize(filter);
  return label.normalized === filter;
}

// Normalize label -- should match server ideally
export function normalize(label: string) {
  return label.trim().toLowerCase();
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
  let rmLabels: Record<string, true> = {};
  _.each(update.rm || [], (l) => rmLabels[l.normalized] = true);

  /*
    Remove additions too (we'll re-add later, but this ensures
    the additions actually replace the old labels when we do a uniqueness
    check)
  */
  _.each(update.add || [], (l) => rmLabels[l.normalized] = true);

  return _(labels)
    .filter((l) => !rmLabels[l.normalized])
    .concat(update.add || [])
    .sortBy((l) => l.normalized)
    .sortedUniqBy((l) => l.normalized)
    .value();
}


/*
  Returns updated labels + hashtags for an events
*/
export function updateEventLabels(event: ApiT.GenericCalendarEvent, update: {
  add?: ApiT.LabelInfo[];
  rm?: ApiT.LabelInfo[];
}): {
  labels: ApiT.LabelInfo[];
  hashtags: ApiT.HashtagState[];
} {
  let hashtags = event.hashtags;
  let labels = getLabels(event, false);

  // Store in hash for lookup
  let rmLabels: Record<string, ApiT.LabelInfo> = {};
  _.each(update.rm || [], (l) => rmLabels[l.normalized] = l);
  let addLabels: Record<string, ApiT.LabelInfo> = {};
  _.each(update.add || [], (l) => addLabels[l.normalized] = l);

  /*
    Update hashtags first -- this also removes from hash so as to avoid
    double adding / removing later.
  */
  hashtags = _.map(hashtags, (h) => {
    let id = h.label ? h.label.normalized : h.hashtag.normalized
    if (rmLabels[id]) {
      delete rmLabels[id];
      return { ...h, approved: false };
    }
    if (addLabels[id]) {
      delete addLabels[id];
      return { ...h, approved: true };
    }
    return h;
  });

  // Apply remaining hash to filter labels
  labels = _(labels || [])
    .filter((l) => !rmLabels[l.normalized] && !addLabels[l.normalized])
    .concat(_.values(addLabels))
    .sortBy((l) => l.normalized)
    .sortedUniqBy((l) => l.normalized)
    .value();

  return { labels, hashtags };
}
