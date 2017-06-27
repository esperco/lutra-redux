/*
  Ratings and helpers feedback
*/
import * as ApiT from "./apiT";

export const POSITIVE_FEEDBACK_THRESHOLD = 5;

/*
  Expand feedback patch with implied additions -- e.g. if we rate something
  five stars, clear prior negative feedback.

  This should be done by server, but we replicate here for optimistic
  UI updates.
*/
export function merge<K extends keyof ApiT.EventFeedback>(
  current: ApiT.GuestEventFeedback,
  patch: ApiT.GuestEventFeedbackPatch<K>
): ApiT.EventFeedback {
  let is_organizer = patch.stars ? false :
    !!val("is_organizer", current, patch);
  let didnt_attend = patch.stars ? false :
    !!val("didnt_attend", current, patch);
  let stars = (is_organizer || didnt_attend) ?
    null : val("stars", current, patch);
  let opts = {
    stars,
    is_organizer,
    didnt_attend
  };

  let agenda = nullify(val("agenda", current, patch), opts);
  let on_time = nullify(val("on_time", current, patch), opts);
  let good_time_mgmt = nullify(val("good_time_mgmt", current, patch), opts);
  let contributed = nullify(val("contributed", current, patch), opts);
  let presence_useful = nullify(val("presence_useful", current, patch), opts);
  let action_items = nullify(val("action_items", current, patch), opts);

  // NB: Nullify handles this right now, but if we get rid of the nullify
  // behavior here, remember to flip presence_useful based on contributed's
  // value and vice versa.

  // Handle text notes
  let notes = nullifyAny(val("notes", current, patch), opts);

  return {
    stars,
    is_organizer,
    didnt_attend,
    agenda,
    on_time,
    good_time_mgmt,
    contributed,
    presence_useful,
    action_items,
    notes
  };
}

// Extract val from feedback for merge purposes
function val<K extends keyof ApiT.EventFeedback>(
  key: K,
  current: ApiT.GuestEventFeedback,
  patch: ApiT.GuestEventFeedbackPatch<any>
): ApiT.EventFeedback[K]|null {
  return typeof patch[key] === "undefined" ?
    (typeof current[key] === "undefined" ? null : current[key]) :
    patch[key];
}

// Nullify tags if stars don't support
function nullify(tagVal: boolean|null, opts: {
  stars: number|null,
  is_organizer: boolean,
  didnt_attend: boolean
}): boolean|null {
  tagVal = nullifyAny(tagVal, opts);
  if (opts.stars && opts.stars >= POSITIVE_FEEDBACK_THRESHOLD) {
    return tagVal || null;
  }
  return tagVal === false ? false : null;
}

function nullifyAny<T>(val: T|null, opts: {
  stars: number|null,
  is_organizer: boolean,
  didnt_attend: boolean
}): T|null {
  if (! opts.stars) return null;
  if (opts.is_organizer) return null;
  if (opts.didnt_attend) return null;
  return val;
}