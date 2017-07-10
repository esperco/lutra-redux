/*
  Ratings and helpers feedback
*/
import * as moment from "moment";
import * as ApiT from "./apiT";
import * as Log from "./log";

export const POSITIVE_FEEDBACK_THRESHOLD = 5;

/*
  Expand feedback patch with implied additions -- e.g. if we rate something
  five stars, clear prior negative feedback.

  This should be done by server, but we replicate here for optimistic
  UI updates.
*/
export function expand(
  patch: Partial<ApiT.EventFeedback>,
  original?: Partial<ApiT.EventFeedback>
): Partial<ApiT.EventFeedback> {
  // Use stars as a proxy for understanding what needs to change
  let originalStars = original ? original.stars || null : undefined;

  // Clone patch so we can mutate below
  patch = { ...patch };

  // Organizer / didn't attend => no stars
  if (patch.is_organizer || patch.didnt_attend) {
    patch.stars = null;
  }

  // Rating => cannot be organizer and must have attended
  if (patch.stars && !originalStars) {
    patch.is_organizer = false;
    patch.didnt_attend = false;
  }

  // If stars are changing, we need to nullify inconsistent tags
  // Ignore if orginal stars are null though (since tags should already be null)
  // Also ignore if original is undefined (since we don't want to inadvertently
  // clobber server values we don't know about)
  let patchPositive = patch.stars ?
    patch.stars >= POSITIVE_FEEDBACK_THRESHOLD : null;
  let origPositive = originalStars ?
    originalStars >= POSITIVE_FEEDBACK_THRESHOLD : null;
  if (typeof patch.stars !== "undefined" &&
      typeof originalStars !== "undefined" &&
      originalStars !== null &&
      patchPositive !== origPositive) {

    /*
      If we're moving into positive rating, all tags must be true or null.
      If we're moving into negative rating, all tags must be false or null.
      If rating is null, all tags must be null.
    */
    let fn: (tag?: boolean|null) => boolean|null = patch.stars ?
      (patch.stars >= POSITIVE_FEEDBACK_THRESHOLD ?
        (tag?: boolean|null) => tag || null :
        (tag?: boolean|null) => typeof tag === "undefined" ? null : tag && null
      ) : () => null;
    patch.agenda = fn(patch.agenda);
    patch.on_time = fn(patch.on_time);
    patch.good_time_mgmt = fn(patch.good_time_mgmt);
    patch.contributed = fn(patch.contributed);
    patch.presence_useful = fn(patch.presence_useful);
    patch.action_items = fn(patch.action_items);

    // Only allow text notes if there's a star rating.
    if (! patch.stars) {
      patch.notes = null;
    }
  }

  return patch;
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

  TODO: Adjust so we get this from server (end time is not always exactly
  before current end of event).
*/
export function canTogglePref(event: ApiT.Event, now?: Date) {
  return moment(event.end).isAfter(now || new Date());
}