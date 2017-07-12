import { expect } from "chai";
import makeEvent from "../fakes/events-fake";
import { stubLogs } from "../fakes/stubs";
import * as ApiT from "../lib/apiT";
import { sandbox } from "../lib/sandbox";
import {
  merge, toPick,
  useRecurringPref,
  canTogglePref,
  feedbackPref
} from "./feedback";

describe("Feedback helpers", () => {
  // Helpers for populating state object
  const expand = (x: Partial<ApiT.GuestEventFeedback>) => ({
    uid: "uid",
    ...x
  });

  const negativeTags: ApiT.NegativeFeedbackTags = {
    no_agenda: false,
    started_late: false,
    poor_time_mgmt: false,
    guest_not_needed: false,
    no_action_items: false
  };

  const positiveTags: ApiT.PositiveFeedbackTags = {
    agenda: false,
    on_time: false,
    good_time_mgmt: false,
    contributed: false,
    action_items: false
  };

  describe("merge", () => {
    it("should not mutate existing patch or original state", () => {
      let patch = { stars: 4 };
      let original = expand({ stars: 5 });
      merge(original, patch);
      expect(patch).to.deep.equal({ stars: 4 });
      expect(original).to.deep.equal(expand({ stars: 5 }));
    });

    it("should unset stars and tags if is_organizer", () => {
      let ret = merge(expand({ stars: 5 }), { is_organizer: true });
      expect(ret).to.deep.equal(expand({
        is_organizer: true,
        ...negativeTags,
        ...positiveTags
      }));
    });

    it("should unset stars and tags if didnt_attend", () => {
      let original = expand({ stars: 5 });
      let ret = merge(original, { didnt_attend: true });
      expect(ret).to.deep.equal(expand({
        didnt_attend: true,
        ...negativeTags,
        ...positiveTags
      }));
    });

    it("should unset is_organizer and didnt_attend if stars specified", () => {
      let ret = merge(expand({
        didnt_attend: true, is_organizer: true
      }), { stars: 5 });
      expect(ret).to.deep.equal(expand({
        stars: 5,
        is_organizer: false,
        didnt_attend: false,
        ...negativeTags
      }));
    });

    it("should unset negative tags if positive rating", () => {
      let ret = merge(expand({
        stars: 4,
        started_late: true
      }), {
        stars: 5,
        agenda: true
      });
      expect(ret).to.deep.equal(expand({
        stars: 5,
        is_organizer: false,
        didnt_attend: false,
        agenda: true,
        ...negativeTags
      }));
    });

    it("should unset positive tags if changing to negative rating", () => {
      let ret = merge(expand({
        stars: 5,
        agenda: true
      }), {
        stars: 4,
        no_action_items: false
      });
      expect(ret).to.deep.equal(expand({
        stars: 4,
        is_organizer: false,
        didnt_attend: false,
        no_action_items: false,
        ...positiveTags
      }));
    });

    it("should allow posting notes", () => {
      let ret = merge(expand({ stars: 3 }), { notes: "Hello" });
      expect(ret).to.deep.equal(expand({
        stars: 3,
        is_organizer: false,
        didnt_attend: false,
        notes: "Hello",
        ...positiveTags
      }));
    });
  });

  describe("toPick", () => {
    it("should log an error if undefined key", () => {
      let logs = stubLogs();
      toPick({ stars: undefined, didnt_attend: true });
      expect(logs.error.called).to.be.true;
    });

    it("should not log an error if all keys defined", () => {
      let logs = stubLogs();
      toPick({ stars: null, didnt_attend: true });
      expect(logs.error.called).to.not.be.true;
    });

    it("should remove undefined props", () => {
      stubLogs();
      let ret = toPick({ stars: undefined, didnt_attend: true });
      expect(ret).to.deep.equal({ didnt_attend: true });
    });
  });

  describe("canTogglePref", () => {
    beforeEach(() => {
      let now = (new Date("2016-10-05T00:00:00.000Z")).getTime();
      sandbox.useFakeTimers(now);
    });

    it("returns false if event already over", () => {
      let event = makeEvent({
        start: "2016-10-04T07:00:00.000Z",
        end: "2016-10-04T08:00:00.000Z"
      });
      expect(canTogglePref(event)).to.be.false;
    });

    it("returns true if event not yet over", () => {
      let event = makeEvent({
        start: "2016-10-04T07:00:00.000Z",
        end: "2016-10-05T08:00:00.000Z"
      });
      expect(canTogglePref(event)).to.be.true;
    });
  });

  describe("useRecurringPref", () => {
    it("returns true if recurring event with global pref", () => {
      let event = makeEvent({
        recurring_event_id: "recur-id",
        global_feedback_pref: false
      });
      expect(useRecurringPref(event)).to.be.true;
    });

    it("returns true if recurring event with recurring pref", () => {
      let event = makeEvent({
        recurring_event_id: "recur-id",
        recurring_feedback_pref: false
      });
      expect(useRecurringPref(event)).to.be.true;
    });

    it("returns false if not recurring event", () => {
      let event = makeEvent({
        recurring_feedback_pref: true
      });
      expect(useRecurringPref(event)).to.be.false;
    });

    it("returns false if instance pref", () => {
      let event = makeEvent({
        recurring_event_id: "recur-id",
        global_feedback_pref: true,
        recurring_feedback_pref: true,
        feedback_pref: false
      });
      expect(useRecurringPref(event)).to.be.false;
    });
  });

  describe("feedbackPref", () => {
    it("handles no prefs gracefully", () => {
      expect(feedbackPref(makeEvent())).to.be.false;
    });

    it("defaults to global feedback pref", () => {
      let event = makeEvent({
        global_feedback_pref: true
      });
      expect(feedbackPref(event)).to.be.true;
    });

    it("favors recurring feedback pref over global", () => {
      let event = makeEvent({
        global_feedback_pref: true,
        recurring_feedback_pref: false
      });
      expect(feedbackPref(event)).to.be.false;
    });

    it("favors instance pref over recurring pref", () => {
      let event = makeEvent({
        global_feedback_pref: true,
        recurring_feedback_pref: false,
        feedback_pref: true
      });
      expect(feedbackPref(event)).to.be.true;
    });
  });
});