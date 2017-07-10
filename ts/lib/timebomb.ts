/*
  Agenda / timebomb helpers
*/
import * as moment from "moment";
import * as ApiT from "./apiT";
import { hasTag } from "./util";

/*
  Can agenda be activated for this event?
*/
export function canTogglePref(event: ApiT.Event, now?: Date) {
  if (event.timebomb && hasTag("Stage0", event.timebomb)) {
    let { set_by } = event.timebomb[1];
    return moment(set_by).isSameOrAfter(now || new Date());
  }
  return false;
}

// Should timebomb pref changes apply to recurrence or instance?
export function useRecurringPref(event: ApiT.Event) {
  return !!event.recurring_event_id &&
    typeof event.timebomb_pref !== "boolean";
}

// Return timebomb preference for event
export function timebombPref(event: ApiT.Event) {
  return !![
    event.timebomb_pref,
    event.recurring_timebomb_pref,
    event.global_timebomb_pref
  ].find((v) => typeof v === "boolean")
}