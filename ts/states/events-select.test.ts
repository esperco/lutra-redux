import { expect } from "chai";
import makeEvent from "../fakes/events-fake";
import { deepFreeze } from "../lib/util";
import { initState, reduceEventToggling } from "./events-select";
import { initState as initGroupState } from "./group-events";

describe("reduceEventToggling", () => {
  const groupId = "group-id";
  const e1 = makeEvent({ id: "e1" });
  const e2 = makeEvent({ id: "e2" });
  const e3 = makeEvent({ id: "e3" });

  const s1 = {
    ...initState(),
    ...initGroupState(),
    groupEvents: {
      [groupId]: {
        [e1.id]: e1,
        [e2.id]: e2,
        [e3.id]: e3
      }
    }
  };

  it("allows for selection of multiple events", () => {
    let s2 = reduceEventToggling(deepFreeze(s1), {
      type: "TOGGLE_EVENT_SELECTION",
      groupId,
      eventIds: {
        [e1.id]: true
      }
    });
    expect(s2.selectedEvents).to.deep.equal({ [e1.id]: true });

    let s3 = reduceEventToggling(deepFreeze(s2), {
      type: "TOGGLE_EVENT_SELECTION",
      groupId,
      eventIds: {
        [e2.id]: true,
        [e3.id]: true
      }
    });
    expect(s3.selectedEvents).to.deep.equal({
      [e1.id]: true,
      [e2.id]: true,
      [e3.id]: true
    });
  });


  it("allows for removal of selected events", () => {
    let s2: typeof s1 = {
      ...s1,
      selectedEvents: {
        [e1.id]: true,
        [e2.id]: true,
        [e3.id]: true
      }
    };

    let s3 = reduceEventToggling(deepFreeze(s2), {
      type: "TOGGLE_EVENT_SELECTION",
      groupId,
      eventIds: {
        [e2.id]: false,
        [e3.id]: false
      }
    });
    expect(s3.selectedEvents).to.deep.equal({
      [e1.id]: true
    });
  });

  it("clears all selected events", () => {
    let s2: typeof s1 = {
      ...s1,
      selectedEvents: {
        [e1.id]: true,
        [e2.id]: true
      }
    };

    let s3 = reduceEventToggling(deepFreeze(s2), {
      type: "TOGGLE_EVENT_SELECTION",
      groupId,
      clear: true,
      eventIds: {}
    });
    expect(s3.selectedEvents).to.deep.equal({});
  });

  it("can clear, then add in single action", () => {
    let s2: typeof s1 = {
      ...s1,
      selectedEvents: {
        [e1.id]: true
      }
    };

    let s3 = reduceEventToggling(deepFreeze(s2), {
      type: "TOGGLE_EVENT_SELECTION",
      groupId,
      clear: true,
      eventIds: { [e2.id]: true }
    });
    expect(s3.selectedEvents).to.deep.equal({ [e2.id]: true });
  });

  describe("with recurring events", () => {
    const recurring_event_id = "recur";
    const e4 = makeEvent({
      id: "e4", recurring_event_id,
      has_recurring_labels: true,
      labels: []
    });
    const e5 = { ...e4, id: "e5" };
    const e6 = { ...e4, id: "e6", has_recurring_labels: false };

    const s2: typeof s1 = {
      ...initState(),
      ...initGroupState(),
      groupEvents: {
        [groupId]: {
          [e4.id]: e4,
          [e5.id]: e5,
          [e6.id]: e6
        }
      },
      groupRecurringEvents: {
        [groupId]: {
          [recurring_event_id]: {
            [e4.id]: true,
            [e5.id]: true,
            [e6.id]: true
          }
        }
      },
      selectedEvents: {
        [e4.id]: true,
        [e6.id]: true
      }
    };

    it("removes recurring instances of events based on an instance ID " +
       "if not detached from master event", () => {
      let s3 = reduceEventToggling(deepFreeze(s2), {
        type: "TOGGLE_EVENT_SELECTION",
        groupId,
        eventIds: { [e5.id]: false }
      });

      // E6 is detached, so not removed. But E4 is recurring and removed.
      expect(s3.selectedEvents).to.deep.equal({
        [e6.id]: true
      });
    });
  });
});
