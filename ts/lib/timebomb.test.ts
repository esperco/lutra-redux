import { expect } from "chai";
import makeEvent from "../fakes/events-fake";
import { sandbox } from "./sandbox";
import { canTogglePref, useRecurringPref, timebombPref } from "./timebomb";

describe("Timebomb helpers", () => {
  describe("canTogglePref", () => {
    beforeEach(() => {
      let now = (new Date("2016-10-05T00:00:00.000Z")).getTime();
      sandbox.useFakeTimers(now);
    });

    it("returns false if no timebomb_set_by field", () => {
      let event = makeEvent();
      expect(canTogglePref(event)).to.be.false;
    });

    it("return false for Stage1 events", () => {
      let event = makeEvent({
        timebomb: ["Stage1", {
          contributors: [], confirm_by: "2016-10-06T07:00:00.000Z"
        }]
      });
      expect(canTogglePref(event)).to.be.false;
    });

    it("return false for Stage2 events", () => {
      let event = makeEvent({
        timebomb: ["Stage2", "Event_confirmed"]
      });
      expect(canTogglePref(event)).to.be.false;
    });

    it("returns true if set_by hasn't occured yet", () => {
      let event = makeEvent({
        timebomb_set_by: "2016-10-06T07:00:00.000Z",
        timebomb: ["Stage0", {}]
      });
      expect(canTogglePref(event)).to.be.true;
    });

    it("returns false if set_by is past", () => {
      let event = makeEvent({
        timebomb_set_by: "2016-10-04T07:00:00.000Z",
        timebomb: ["Stage0", {}]
      });
      expect(canTogglePref(event)).to.be.false;
    });
  });

  describe("useRecurringPref", () => {
    it("returns true if recurring event with global pref", () => {
      let event = makeEvent({
        recurring_event_id: "recur-id",
        global_timebomb_pref: false
      });
      expect(useRecurringPref(event)).to.be.true;
    });

    it("returns true if recurring event with recurring pref", () => {
      let event = makeEvent({
        recurring_event_id: "recur-id",
        recurring_timebomb_pref: false
      });
      expect(useRecurringPref(event)).to.be.true;
    });

    it("returns false if not recurring event", () => {
      let event = makeEvent({
        recurring_timebomb_pref: true
      });
      expect(useRecurringPref(event)).to.be.false;
    });

    it("returns false if instance pref", () => {
      let event = makeEvent({
        recurring_event_id: "recur-id",
        global_timebomb_pref: true,
        recurring_timebomb_pref: true,
        timebomb_pref: false
      });
      expect(useRecurringPref(event)).to.be.false;
    });
  });

  describe("timebombPref", () => {
    it("handles no prefs gracefully", () => {
      expect(timebombPref(makeEvent())).to.be.false;
    });

    it("defaults to global timebomb pref", () => {
      let event = makeEvent({
        global_timebomb_pref: true
      });
      expect(timebombPref(event)).to.be.true;
    });

    it("favors recurring timebomb pref over global", () => {
      let event = makeEvent({
        global_timebomb_pref: true,
        recurring_timebomb_pref: false
      });
      expect(timebombPref(event)).to.be.false;
    });

    it("favors instance pref over recurring pref", () => {
      let event = makeEvent({
        global_timebomb_pref: true,
        recurring_timebomb_pref: false,
        timebomb_pref: true
      });
      expect(timebombPref(event)).to.be.true;
    });
  });
});