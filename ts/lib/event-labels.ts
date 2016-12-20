/*
  Event label helpers
*/
import * as _ from "lodash";
import * as ApiT from "./apiT";
import { ColorMap, getColorForMap } from "./colors";

const PREDICTED_LABEL_PERCENT_CUTOFF = 0.5;

/*
  Takes team or group labels, plus a list of events -- returns a list of labels
  plus totals for labels
*/
export function getLabelCounts(
  baseLabels: ApiT.LabelInfo[],
  events: ApiT.GenericCalendarEvent[]
): {
  labels: ApiT.LabelInfo[];
  counts: Record<string, number>; // Normalized => count
} {
  // Map for faster lookup. Ret preserves order.
  let counts: {[norm: string]: number} = {};
  let labels = _.clone(baseLabels);

  // Prepopulate with base group or team labels
  _.each(labels, (l) => {
    counts[l.normalized] = 0;
  });

  // Iterate through each event
  _.each(events, (ev) => {
    let eventLabels = getLabels(ev);
    _.each(eventLabels, (l) => {

      // Exists, increment
      if (_.isNumber(counts[l.normalized])) {
        counts[l.normalized] += 1;
      }

      // Else, new label
      else {
        counts[l.normalized] = 1;
        labels.push(l);
      }
    });
  });

  return { labels, counts };
}

/*
  Like label counts except (instead of counts) we get a true/false/"some"
  value for whether labels are applicable on the given events
*/
export function getLabelSelections(
  baseLabels: ApiT.LabelInfo[],
  events: ApiT.GenericCalendarEvent[]
): {
  labels: ApiT.LabelInfo[];
  selections: Record<string, boolean|"some">; // Normalized to value
} {
  let { labels, counts } = getLabelCounts(baseLabels, events);
  return {
    labels,
    selections: _.mapValues(counts, (v) => {
      if (v === 0) return false;
      if (v === events.length) return true;
      return "some";
    })
  }
}

/*
  Get labels for a single event -- includes logic for handling predicted
  labels and hashtags.
*/
export function getLabels(event: ApiT.GenericCalendarEvent): ApiT.LabelInfo[] {
  // Default to user-specified labels if they exist
  if (event.labels) {
    return event.labels;
  }

  // Hashtags
  let hashtags = _(event.hashtags)
    .filter((h) => h.approved !== false)
    .map((h) => h.label || ({
      ...h.hashtag, color: newLabelColor(h.hashtag.normalized)
    }))
    .value();
  if (! _.isEmpty(event.hashtags)) {
    return hashtags;
  }

  // Predictions
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

export function filterLabels<T extends ApiT.LabelInfo>(
  labels: T[], filter: string
): T[] {
  filter = normalize(filter);
  return _.filter(labels, (l) => _.includes(l.normalized, filter));
}

export function match<T extends ApiT.LabelInfo>(
  labels: T[], filter: string
): T {
  filter = normalize(filter);
  return _.find(labels, (l) => l.normalized === filter);
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
  let rmLabels: Record<string, boolean> = {};
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