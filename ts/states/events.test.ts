import * as _ from "lodash";
import { expect } from "chai";
import {
  eventsDataReducer, eventsUpdateReducer, invalidatePeriodReducer,
  initState, EventsState, QueryResult
} from "./events";
import makeEvent from "../fakes/events-fake";
import { testLabel } from "../fakes/labels-fake";
import { stringify } from "../lib/event-queries";
import { Period, fromDates } from "../lib/period";
import { sandbox } from "../lib/sandbox";
import { deepFreeze } from "../lib/util";

// Helper function to pre-populate state for each day in period (and one
// day before and after)
function prePop(
  state: EventsState,
  groupId: string,
  period: Period<"day">
) {
  state.eventQueries[groupId] = state.eventQueries[groupId] || [];
  state.events[groupId] = state.events[groupId] || {};
  for (let i = period.start - 1; i <= period.end + 1; i++) {
    state.eventQueries[groupId][i] = {};
  }
}

const calgroupId = "calgroupid";

describe("group-events / eventsDataReducer", () => {
  describe("when handling FETCH_QUERY_START", () => {
    it("sets FETCHING for each day of period", () => {
      let s = initState();
      let query = { labels: { all: true } };
      let s2 = eventsDataReducer(deepFreeze(s), {
        type: "EVENTS_DATA",
        dataType: "FETCH_QUERY_START",
        calgroupId,
        periods: [{ interval: "week", start: 100, end: 100 }],
        query
      });

      let queryKey = stringify(query);
      expect(s2.eventQueries[calgroupId][695]).to.be.undefined;
      expect(s2.eventQueries[calgroupId][696][queryKey])
        .to.equal("FETCHING");
      expect(s2.eventQueries[calgroupId][702][queryKey])
        .to.equal("FETCHING");
      expect(s2.eventQueries[calgroupId][703]).to.be.undefined;
    });

    it("does not clobber existing data when fetching", () => {
      let s = initState();
      let period = fromDates("day",
        new Date("2016-10-01"),
        new Date("2016-10-03")
      );
      let query = { labels: { all: true } };
      let queryKey = stringify(query);
      let oldData = {
        query,
        eventIds: ["test"],
        updatedOn: new Date()
      }

      prePop(s, calgroupId, period);
      s.eventQueries[calgroupId][period.start][queryKey] = oldData;
      s.eventQueries[calgroupId][period.end][queryKey] = "FETCH_ERROR";

      let s2 = eventsDataReducer(deepFreeze(s), {
        type: "EVENTS_DATA",
        dataType: "FETCH_QUERY_START",
        calgroupId,
        periods: [period],
        query
      });

      // Don't replace data (but do replace FETCH_ERROR)
      expect(s2.eventQueries[calgroupId][period.start][queryKey])
        .to.deep.equal(oldData);
      expect(s2.eventQueries[calgroupId][period.end][queryKey])
        .to.equal("FETCHING");
    });
  });

  describe("when handling FETCH_QUERY_END", () => {
    it("populates eventQueries with a list of eventIds for each day",
    () => {
      let now = new Date("2016-11-01 0:0");
      sandbox.useFakeTimers(now.getTime());

      let e1 = makeEvent({ id: "e1",
        start: "2016-10-01T08:00:00.000",
        end:   "2016-10-02T08:00:00.000",
      });
      let e2 = makeEvent({ id: "e2",
        start: "2016-10-02T09:00:00.000",
        end:   "2016-10-03T02:00:00.000",
      });
      let e3 = makeEvent({ id: "e3",
        start: "2016-10-02T10:00:00.000",
        end:   "2016-10-02T11:00:00.000",
      });

      let s = initState();
      let period = fromDates("day",
        new Date("2016-10-01 0:0"),
        new Date("2016-10-03 0:0")
      );
      let query = { labels: { all: true } };
      let s2 = eventsDataReducer(deepFreeze(s), {
        type: "EVENTS_DATA",
        dataType: "FETCH_QUERY_END",
        calgroupId,
        period, query,
        events: [e1, e2, e3]
      });
      let queryKey = stringify(query);

      // 10-1
      expect(s2.eventQueries[calgroupId][period.start][queryKey])
        .to.deep.equal({
          query,
          eventIds: [e1.id],
          updatedOn: now
        });

      // 10-2
      expect(s2.eventQueries[calgroupId][period.start + 1][queryKey])
        .to.deep.equal({
          query,
          eventIds: [e1.id, e2.id, e3.id],
          updatedOn: now
        });

      // 10-3
      expect(s2.eventQueries[calgroupId][period.end][queryKey])
        .to.deep.equal({
          query,
          eventIds: [e2.id],
          updatedOn: now
        });
    });

    it("does not populate outside specified period",
    () => {
      let then = new Date("2016-10-31 0:0");
      let now = new Date("2016-11-01 0:0");
      sandbox.useFakeTimers(now.getTime());

      let e1 = makeEvent({ id: "e1",
        start: "2016-10-01T08:00:00.000",
        end:   "2016-10-03T08:00:00.000",
      });

      let s = initState();
      let period = fromDates("day",
        new Date("2016-10-02 0:0"),
        new Date("2016-10-02 0:0")
      );
      let query = { labels: { all: true } };
      let queryKey = stringify(query);

      // Prepopulate state a bit more to test that the right things get
      // clobbered
      prePop(s, calgroupId, period);
      s.eventQueries[calgroupId][period.start - 1][queryKey] = {
        query, eventIds: ["test"], updatedOn: then
      };
      s.eventQueries[calgroupId][period.start][queryKey] = {
        query, eventIds: ["test"], updatedOn: then
      };
      s.eventQueries[calgroupId][period.end + 1][queryKey] = {
        query, eventIds: ["test"], updatedOn: then
      };

      let s2 = eventsDataReducer(deepFreeze(s), {
        type: "EVENTS_DATA",
        dataType: "FETCH_QUERY_END",
        calgroupId,
        period, query,
        events: [e1]
      });

      // 10-1
      expect(s2.eventQueries[calgroupId][period.start - 1][queryKey])
        .to.deep.equal({ query, eventIds: ["test"], updatedOn: then });

      // 10-2
      expect(s2.eventQueries[calgroupId][period.start][queryKey])
        .to.deep.equal({ query, eventIds: [e1.id], updatedOn: now });

      // 10-3
      expect(s2.eventQueries[calgroupId][period.end + 1][queryKey])
        .to.deep.equal({ query, eventIds: ["test"], updatedOn: then });
    });

    it("populates events with updated event data",  () => {
      let e1 = makeEvent({ id: "e1",
        start: "2016-10-01T08:00:00.000",
        end:   "2016-10-02T08:00:00.000",
      });
      let e2 = makeEvent({ id: "e2",
        start: "2016-10-02T09:00:00.000",
        end:   "2016-10-03T02:00:00.000",
      });

      let s = initState();

      // Pre-populate a bit to make sure right data gets clobbered
      let oldE1 = makeEvent({ id: "e1", title: "Not the title" });
      let oldE3 = makeEvent({ id: "e3" });
      s.events[calgroupId] = {
        "e1": oldE1,
        "e3": oldE3
      };

      let period = fromDates("day",
        new Date("2016-10-02 0:0"),
        new Date("2016-10-04 0:0")
      );
      let query = { labels: { all: true } };
      let s2 = eventsDataReducer(deepFreeze(s), {
        type: "EVENTS_DATA",
        dataType: "FETCH_QUERY_END",
        calgroupId,
        period, query,
        events: [e1, e2]
      });

      expect(s2.events[calgroupId][e1.id]).to.deep.equal(e1);
      expect(s2.events[calgroupId][e2.id]).to.deep.equal(e2);
      expect(s2.events[calgroupId][oldE3.id]).to.deep.equal(oldE3);
    });

    it("populates our recurring events list", () => {
      let e1a = makeEvent({ id: "e1a",
        start: "2016-10-01T08:00:00.000",
        end:   "2016-10-02T08:00:00.000",
        recurring_event_id: "e1_recurring"
      });
      let e1b = makeEvent({ id: "e1b",
        start: "2016-10-01T08:00:00.000",
        end:   "2016-10-02T08:00:00.000",
        recurring_event_id: "e1_recurring"
      });
      let e2 = makeEvent({ id: "e2",
        start: "2016-10-02T09:00:00.000",
        end:   "2016-10-03T02:00:00.000",
        recurring_event_id: "e2_recurring"
      });
      let e3 = makeEvent({ id: "e3",
        start: "2016-10-02T09:00:00.000",
        end:   "2016-10-03T02:00:00.000"
      });

      let s = initState();
      let period = fromDates("day",
        new Date("2016-10-01 0:0"),
        new Date("2016-10-05 0:0")
      );
      let query = {};
      let s2 = eventsDataReducer(deepFreeze(s), {
        type: "EVENTS_DATA",
        dataType: "FETCH_QUERY_END",
        calgroupId,
        period, query,
        events: [e1a, e1b, e2, e3]
      });

      expect(s2.recurringEvents[calgroupId]).to.deep.equal({
        "e1_recurring": { e1a: true, e1b: true },
        "e2_recurring": { e2: true }
      });
    });

    it("should add recurring events to existing list", () => {
      let e1a = makeEvent({ id: "e1a",
        start: "2016-10-01T08:00:00.000",
        end:   "2016-10-02T08:00:00.000",
        recurring_event_id: "e1_recurring"
      });
      let e1b = makeEvent({ id: "e1b",
        start: "2016-10-02T08:00:00.000",
        end:   "2016-10-03T08:00:00.000",
        recurring_event_id: "e1_recurring"
      });

      let s = initState();
      let period1 = fromDates("day",
        new Date("2016-10-01 0:0"),
        new Date("2016-10-02 0:0")
      );
      let period2 = fromDates("day",
        new Date("2016-10-02 0:0"),
        new Date("2016-10-03 0:0")
      );
      let query = {};

      let s2 = eventsDataReducer(deepFreeze(s), {
        type: "EVENTS_DATA",
        dataType: "FETCH_QUERY_END",
        calgroupId,
        period: period1, query,
        events: [e1a]
      });
      let s3 = eventsDataReducer(deepFreeze(s2), {
        type: "EVENTS_DATA",
        dataType: "FETCH_QUERY_END",
        calgroupId,
        period: period2, query,
        events: [e1b]
      });

      expect(s3.recurringEvents[calgroupId]).to.deep.equal({
        "e1_recurring": { e1a: true, e1b: true }
      });
    });
  });

  describe("when handling FETCH_QUERY_FAIL", () => {
    it("marks eventQueries with FETCH_ERROR", () => {
      let s = initState();
      let period = fromDates("day",
        new Date("2016-10-01 0:0"),
        new Date("2016-10-02 0:0")
      );
      let query = { labels: { all: true } };
      let s2 = eventsDataReducer(deepFreeze(s), {
        type: "EVENTS_DATA",
        dataType: "FETCH_QUERY_FAIL",
        calgroupId,
        period, query
      });
      let queryKey = stringify(query);

      expect(s2.eventQueries[calgroupId][period.start - 1])
        .to.be.undefined;
      expect(s2.eventQueries[calgroupId][period.start][queryKey])
        .to.equal("FETCH_ERROR");
      expect(s2.eventQueries[calgroupId][period.end][queryKey])
        .to.equal("FETCH_ERROR");
      expect(s2.eventQueries[calgroupId][period.end + 1])
        .to.be.undefined;
    });

    it("does not clobber existing data with FETCH_ERROR", () => {
      let s = initState();
      let period = fromDates("day",
        new Date("2016-10-01 0:0"),
        new Date("2016-10-03 0:0")
      );
      let query = { labels: { all: true } };
      let queryKey = stringify(query);
      let oldData = {
        query,
        eventIds: ["test"],
        updatedOn: new Date()
      };

      prePop(s, calgroupId, period);
      s.eventQueries[calgroupId][period.start][queryKey] = oldData;
      s.eventQueries[calgroupId][period.end][queryKey] = "FETCHING";

      let s2 = eventsDataReducer(deepFreeze(s), {
        type: "EVENTS_DATA",
        dataType: "FETCH_QUERY_FAIL",
        calgroupId,
        period, query
      });

      // Don't replace data (but do replace FETCHING)
      expect(s2.eventQueries[calgroupId][period.start][queryKey])
        .to.deep.equal(oldData);
      expect(s2.eventQueries[calgroupId][period.end][queryKey])
        .to.equal("FETCH_ERROR");
    });
  });

  describe("when handling FETCH_IDS_START", () => {
    it("sets FETCHING For given ids", () => {
      let s = initState();
      let s2 = eventsDataReducer(deepFreeze(s), {
        type: "EVENTS_DATA",
        dataType: "FETCH_IDS_START",
        calgroupId,
        eventIds: ["id1", "id2"]
      });
      expect(s2.events[calgroupId]["id1"]).to.equal("FETCHING");
      expect(s2.events[calgroupId]["id2"]).to.equal("FETCHING");
    });

    it("replaces FETCH_ERROR but does not replace existing data with FETCHING",
    () => {
      let s = initState();
      let e2 = makeEvent({ id: "id2" })
      s.events[calgroupId] = {
        id1: "FETCH_ERROR",
        id2: e2
      };
      let s2 = eventsDataReducer(deepFreeze(s), {
        type: "EVENTS_DATA",
        dataType: "FETCH_IDS_START",
        calgroupId,
        eventIds: ["id1", "id2"]
      });
      expect(s2.events[calgroupId]["id1"]).to.equal("FETCHING");
      expect(s2.events[calgroupId]["id2"]).to.deep.equal(e2);
    });
  });

  describe("when handling FETCH_IDS_END", () => {
    it("replaces existing items with data", () => {
      let s = initState();
      let e1 = makeEvent({ id: "id1" });
      let e2 = makeEvent({ id: "id2" });
      let e3a = makeEvent({ id: "id3", title: "Old" });
      let e3b = makeEvent({ id: "id3", title: "New" });
      s.events[calgroupId] = {
        id1: "FETCHING",
        id3: e3a
      };
      let s2 = eventsDataReducer(deepFreeze(s), {
        type: "EVENTS_DATA",
        dataType: "FETCH_IDS_END",
        calgroupId,
        eventIds: ["id1", "id2", "id3"],
        events: [e1, e2, e3b]
      });
      expect(s2.events[calgroupId]["id1"]).to.deep.equal(e1);
      expect(s2.events[calgroupId]["id2"]).to.deep.equal(e2);
      expect(s2.events[calgroupId]["id3"]).to.deep.equal(e3b);
    });

    it("sets FETCH_ERROR for each event it was not able to fetch", () => {
      let s = initState();
      let e1 = makeEvent({ id: "id1" });
      let s2 = eventsDataReducer(deepFreeze(s), {
        type: "EVENTS_DATA",
        dataType: "FETCH_IDS_END",
        calgroupId,
        eventIds: ["id1", "id2"],
        events: [e1]
      });
      expect(s2.events[calgroupId]["id1"]).to.deep.equal(e1);
      expect(s2.events[calgroupId]["id2"]).to.equal("FETCH_ERROR");
    });

    it("does not replace existing data with FETCH_ERROR", () => {
      let s = initState();
      let e1 = makeEvent({ id: "id1" });
      s.events[calgroupId] = { id1: e1 };
      let s2 = eventsDataReducer(deepFreeze(s), {
        type: "EVENTS_DATA",
        dataType: "FETCH_IDS_END",
        calgroupId,
        eventIds: ["id1"],
        events: []
      });
      expect(s2.events[calgroupId]["id1"]).to.deep.equal(e1);
    });
  });
});


//////////

describe("eventsUpdateReducer", () => {

  // Constants for testing labels
  const label1 = testLabel("Label 1");
  const label2 = testLabel("Label 2");
  const label3 = testLabel("Label 3");
  const ev = makeEvent({ id: "e1",
    labels: [label1]
  });
  const s1 = deepFreeze({
    ...initState(),
    events: { [calgroupId]: { "e1": ev } }
  });

  it("updates label data", () => {
    let s2 = eventsUpdateReducer(s1, {
      type: "EVENTS_UPDATE",
      calgroupId,
      eventIds: [ev.id],
      addLabels: [label2],
      rmLabels: [label1]
    });
    expect(s2.events[calgroupId]["e1"]).to.deep.equal({
      ...ev,
      labels: [label2]
    });
  });

  it("confirms event labels", () => {
    let ev2 = {
      ...ev,
      labels_confirmed: false,
      labels_predicted: true,
    };
    let s2 = deepFreeze({
      ...s1,
      events: { [calgroupId]: { "e1": ev2 } }
    });

    let s3 = eventsUpdateReducer(s2, {
      type: "EVENTS_UPDATE",
      calgroupId,
      eventIds: [ev2.id],
      addLabels: [label2],
      rmLabels: [label1]
    });
    expect(s3.events[calgroupId]["e1"]).to.deep.equal({
      ...ev2,
      labels_confirmed: true,
      labels_predicted: false,
      labels: [label2]
    });
  });

  it("unsets labels when hiding", () => {
    let s2 = eventsUpdateReducer(s1, {
      type: "EVENTS_UPDATE",
      calgroupId,
      eventIds: [ev.id],
      hidden: true
    });
    expect(s2.events[calgroupId]["e1"]).to.deep.equal({
      ...ev,
      labels: [],
      hidden: true
    });
  });

  it("confirms hidden", () => {
    let ev2 = {
      ...ev,
      hidden: true,
      labels_confirmed: false,
      labels_predicted: true,
    };
    let s2 = deepFreeze({
      ...s1,
      events: { [calgroupId]: { "e1": ev2 } }
    });

    let s3 = eventsUpdateReducer(s2, {
      type: "EVENTS_UPDATE",
      calgroupId,
      eventIds: [ev2.id]
    });
    expect(s3.events[calgroupId]["e1"]).to.deep.equal({
      ...ev2,
      labels_confirmed: true,
      labels_predicted: false,
      labels: []
    });
  });

  it("should not duplicate labels", () => {
    let s2 = eventsUpdateReducer(s1, {
      type: "EVENTS_UPDATE",
      calgroupId,
      eventIds: [ev.id],
      addLabels: [label1, label2, label2]
    });
    expect(s2.events[calgroupId]["e1"]).to.deep.equal({
      ...ev,
      labels: [label1, label2]
    });
  });

  it("invalidates event queries", () => {
    let s = initState();
    let period = fromDates("day",
      new Date("2016-10-01 0:0"),
      new Date("2016-10-03 0:0")
    );

    let query1 = { labels: { all: true } };
    let queryKey1 = stringify(query1);
    let oldData1 = {
      query: query1,
      eventIds: ["test-1"],
      updatedOn: new Date()
    }

    let query2 = { labels: { none: true } };
    let queryKey2 = stringify(query1);
    let oldData2 = {
      query: query2,
      eventIds: ["test-2"],
      updatedOn: new Date()
    }

    let e1 = makeEvent({ id: "e1",
      start: "2016-10-02T08:00:00.000",
      end:   "2016-10-03T08:00:00.000",
    });

    prePop(s, calgroupId, period);
    s.events[calgroupId]["e1"] = e1;
    let queryDays = s.eventQueries[calgroupId];
    queryDays[period.start][queryKey1] = _.clone(oldData1);
    queryDays[period.start + 1][queryKey1] = _.clone(oldData1);
    queryDays[period.start + 1][queryKey2] = _.clone(oldData2);
    queryDays[period.end][queryKey1] = _.clone(oldData1);
    queryDays[period.end + 1][queryKey1] = _.clone(oldData1);

    let s2 = eventsUpdateReducer(deepFreeze(s), {
      type: "EVENTS_UPDATE",
      calgroupId,
      eventIds: [e1.id],
      addLabels: [label1]
    });

    queryDays = s2.eventQueries[calgroupId];
    expect(
      (queryDays[period.start][queryKey1] as QueryResult).invalid
    ).to.not.be.ok;
    expect(
      (queryDays[period.start + 1][queryKey1] as QueryResult).invalid
    ).to.be.true;
    expect(
      (queryDays[period.start + 1][queryKey2] as QueryResult).invalid
    ).to.be.true;
    expect(
      (queryDays[period.end][queryKey1] as QueryResult).invalid
    ).to.be.true;
    expect(
      (queryDays[period.end + 1][queryKey1] as QueryResult).invalid
    ).to.not.be.ok;
  });

  describe("with recurring event Ids", () => {
    let period = fromDates("day",
      new Date("2016-10-01 0:0"),
      new Date("2016-10-03 0:0")
    );
    let query = {};
    let queryKey = stringify(query);

    const e1 = makeEvent({ id: "e1",
      labels: [label1],
      recurring_event_id: "recurring_id",
      has_recurring_labels: true,
      start: "2016-10-01T08:00:00.000",
      end:   "2016-10-01T09:00:00.000"
    });
    const e2 = makeEvent({ id: "e2",
      labels: [label1],
      recurring_event_id: "recurring_id",
      has_recurring_labels: true,
      start: "2016-10-02T08:00:00.000",
      end:   "2016-10-02T09:00:00.000"
    });
    const e3 = makeEvent({ id: "e3",
      labels: [label2],
      recurring_event_id: "recurring_id",
      has_recurring_labels: false,
      start: "2016-10-03T08:00:00.000",
      end:   "2016-10-03T09:00:00.000"
    });

    const s1: EventsState = {
      ...initState(),
      events: { [calgroupId]: { e1, e2, e3 } },
      recurringEvents: { [calgroupId]: {
        recurring_id: { e1: true, e2: true, e3: true }
      } }
    };
    prePop(s1, calgroupId, period);
    s1.eventQueries[calgroupId][period.start][queryKey] = {
      query, eventIds: ["e1"], updatedOn: new Date()
    };
    s1.eventQueries[calgroupId][period.start + 1][queryKey] = {
      query, eventIds: ["e2"], updatedOn: new Date()
    };
    s1.eventQueries[calgroupId][period.start + 2][queryKey] = {
      query, eventIds: ["e3"], updatedOn: new Date()
    };

    it("updates recurring labels but not non-recurring labels", () => {
      let s2 = eventsUpdateReducer(deepFreeze(s1), {
        type: "EVENTS_UPDATE",
        calgroupId,
        eventIds: [],
        recurringEventIds: ["recurring_id"],
        addLabels: [label3]
      });

      expect(s2.events[calgroupId]["e1"]).to.deep.equal({
        ...e1, labels: [label1, label3]
      });
      expect(s2.events[calgroupId]["e2"]).to.deep.equal({
        ...e2, labels: [label1, label3]
      });

      // Not recurring labels
      expect(s2.events[calgroupId]["e3"]).to.deep.equal(e3);
    });

    it("invalidates all queries for all recurrences", () => {
      let s2 = eventsUpdateReducer(deepFreeze(s1), {
        type: "EVENTS_UPDATE",
        calgroupId,
        eventIds: [],
        recurringEventIds: ["recurring_id"],
        addLabels: [label3]
      });

      let queryDays = s2.eventQueries[calgroupId];
      expect(
        (queryDays[period.start][queryKey] as QueryResult).invalid
      ).to.be.true;
      expect(
        (queryDays[period.start + 1][queryKey] as QueryResult).invalid
      ).to.be.true;
      expect(
        (queryDays[period.start + 2][queryKey] as QueryResult).invalid
      ).to.not.be.ok;
    });

    it("breaks recurrence if individual ID is labeled", () => {
      let s2 = eventsUpdateReducer(deepFreeze(s1), {
        type: "EVENTS_UPDATE",
        calgroupId,
        eventIds: ["e1"],
        addLabels: [label3]
      });

      expect(s2.events[calgroupId]["e1"]).to.deep.equal({
        ...e1,
        labels: [label1, label3],
        has_recurring_labels: false
      });
    });
  })
});


////////

describe("invalidateQueryReducer", () => {
  // Setup

  it("invalidates each query on each day that has an event overlapping " +
     "period", () => {
    /*
      Test setup:

      We three query results spread over four days:

      t = -1 (period.start - 1)
        * query1 => [e1]

      t = 0 (period.start)
        * query1 => [e1]

      t = 1 (period.end)
        * query1 => [e1]
        * query2a => [e2]

      t = 2 (period.end + 1)
        * query2a => [e2]

      t = 3 (period.end + 2)
        * query2b = [other]

      We're invalidating the period for t in [0, 1]. However, because
      e1 (in query1) starts in t = -1 and because e2 (in query2a) continues
      over to t = 2, we should also invalidate t = -1 and t = 2.

      t = 3 should be left alone.
    */

    let s = initState();
    let period = fromDates("day",
      new Date("2016-10-01 0:0"),
      new Date("2016-10-02 0:0")
    );

    let e1 = makeEvent({ id: "e1",
      start: "2016-09-30T08:00:00.000",
      end:   "2016-10-02T08:00:00.000",
    });
    let e2 = makeEvent({ id: "e2",
      start: "2016-10-02T07:00:00.000",
      end:   "2016-10-03T08:00:00.000",
    });

    let query1 = { labels: { all: true } };
    let queryKey1 = stringify(query1);
    let oldData1 = {
      query: query1,
      eventIds: ["e1"],
      updatedOn: new Date()
    }

    let query2 = { labels: { none: true } };
    let queryKey2 = stringify(query1);
    let oldData2a = {
      query: query2,
      eventIds: ["e2"],
      updatedOn: new Date()
    };
    let oldData2b = {
      query: query2,
      eventIds: ["other"],
      updatedOn: new Date()
    }

    prePop(s, calgroupId,
      { ...period, start: period.start - 1, end: period.end + 2 });
    s.events[calgroupId]["e1"] = e1;
    s.events[calgroupId]["e2"] = e2;
    let queryDays = s.eventQueries[calgroupId];
    queryDays[period.start - 1][queryKey1] = _.clone(oldData1);
    queryDays[period.start][queryKey1] = _.clone(oldData1);
    queryDays[period.end][queryKey1] = _.clone(oldData1);
    queryDays[period.end][queryKey2] = _.clone(oldData2a);
    queryDays[period.end + 1][queryKey2] = _.clone(oldData2a);
    queryDays[period.end + 2][queryKey2] = _.clone(oldData2b);

    let s2 = invalidatePeriodReducer(deepFreeze(s), {
      type: "EVENTS_INVALIDATE_PERIOD",
      calgroupId,
      period
    });

    // Should only invalidate inside period
    queryDays = s2.eventQueries[calgroupId];
    expect(
      (queryDays[period.start - 1][queryKey1] as QueryResult).invalid
    ).to.be.true;
    expect(
      (queryDays[period.start][queryKey1] as QueryResult).invalid
    ).to.be.true;
    expect(
      (queryDays[period.end][queryKey1] as QueryResult).invalid
    ).to.be.true;
    expect(
      (queryDays[period.end][queryKey2] as QueryResult).invalid
    ).to.be.true;
    expect(
      (queryDays[period.end + 1][queryKey2] as QueryResult).invalid
    ).to.be.true;
    expect(
      (queryDays[period.end + 2][queryKey2] as QueryResult).invalid
    ).to.not.be.ok;
  });
});