/*
  Ratings and helpers feedback
*/
import * as moment from "moment";
import * as ApiT from "./apiT";
import * as Log from "./log";

export const POSITIVE_FEEDBACK_THRESHOLD = 5;

/*
  Merge feedback patch into original values with implied additions -- e.g. if
  we rate something five stars, clear prior negative feedback.

  Result should not be posted to server. Just send patch. This is solely
  for optimistic UI updates.
*/
export function merge(
  original: ApiT.GuestEventFeedback,
  patch: Partial<ApiT.EventFeedback>
): ApiT.GuestEventFeedback {
  // Apply patch to original, but change clearable values to undefined
  // if nullable
  let { stars, notes, ...patchOther } = patch;
  let ret = { ...original, ...patchOther };
  if (stars === null) delete ret.stars;
  else if (stars) ret.stars = stars;
  if (notes === null) delete ret.notes;
  else if (notes) ret.notes = notes;

  // Organizer / didn't attend => no stars
  if (patch.is_organizer || patch.didnt_attend) {
    delete ret.stars;
    delete ret.notes;
  }

  // Rating => cannot be organizer and must have attended
  if (ret.stars) {
    let update: ApiT.NAFeedbackTags = {
      is_organizer: false,
      didnt_attend: false
    };
    ret = { ...ret, ...update };
  }

  // Positive or null rating - clear negative tags
  if (!ret.stars || ret.stars >= POSITIVE_FEEDBACK_THRESHOLD) {
    let update: ApiT.NegativeFeedbackTags = {
      no_agenda: false,
      started_late: false,
      poor_time_mgmt: false,
      guest_not_needed: false,
      no_action_items: false
    };
    ret = { ...ret, ...update };
  }

  // Negative or null rating - clear negative tags
  if (!ret.stars || ret.stars < POSITIVE_FEEDBACK_THRESHOLD) {
    let update: ApiT.PositiveFeedbackTags = {
      agenda: false,
      on_time: false,
      good_time_mgmt: false,
      contributed: false,
      action_items: false
    };
    ret = { ...ret, ...update };
  }

  return ret;
}

/*
  Converts the feedback Partial to a Pick. Logs an error if there's an
  undefined property on the feedback Partial.

  We use Partials because they're easier to pass around (see, e.g.,
  https://github.com/Microsoft/TypeScript/issues/16756). But our API expects
  a Pick because we want to distinguish between undefined and null. Null
  indicates that we want to clear a patch value. If we encounter something
  that's undefined instead of a null, that may be a possible error, so log it.
*/
export function toPick<K extends keyof ApiT.EventFeedback>(
  patch: Partial<ApiT.EventFeedback>
): Pick<ApiT.EventFeedback, K> {
  for (let key in patch) {
    let k = key as keyof ApiT.EventFeedback;
    if (typeof patch[k] === "undefined") {
      Log.e("Undefined event feedback property. Should use null instead.")
      delete patch[k];
    }
  }
  return patch as any;
}

/*
  Can feedback be activated for this event?
*/
export function canTogglePref(event: ApiT.Event, now?: Date) {
  let set_by = event.feedback_set_by || event.end;
  return moment(set_by).isAfter(now || new Date());
}

// Should feedback pref changes apply to recurrence or instance?
export function useRecurringPref(event: ApiT.Event) {
  return !!event.recurring_event_id &&
    typeof event.feedback_pref !== "boolean";
}

// Return feedback preference for event
export function feedbackPref(event: ApiT.Event) {
  return !![
    event.feedback_pref,
    event.recurring_feedback_pref,
    event.global_feedback_pref
  ].find((v) => typeof v === "boolean")
}