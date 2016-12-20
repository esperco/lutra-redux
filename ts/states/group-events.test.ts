import * as _ from "lodash";
import { expect } from "chai";
import {
  eventsDataReducer, initState, EventsState, QueryResult
} from "./group-events";
import makeEvent from "../fakes/events-fake";
import { Period, fromDates } from "../lib/period";
import { sandbox } from "../lib/sandbox";
import { deepFreeze } from "../lib/util";
import * as stringify from "json-stable-stringify";

describe("group-events / eventsDataReducer", () => {

  // Helper function to pre-populate state for each day in period (and one
  // day before and after)
  function prePop(
    state: EventsState,
    groupId: string,
    period: Period<"day">
  ) {
    state.groupEventQueries[groupId] = state.groupEventQueries[groupId] || [];
    state.groupEvents[groupId] = state.groupEvents[groupId] || {};
    for (let i = period.start - 1; i <= period.end + 1; i++){
      state.groupEventQueries[groupId][i] = {};
    }
  }

  describe("when handling FETCH_QUERY_START", () => {
    it("sets FETCHING for each day of period", () => {
      let s = initState();
      let query = { labels: { all: true } };
      let s2 = eventsDataReducer(deepFreeze(s), {
        type: "GROUP_EVENTS_DATA",
        dataType: "FETCH_QUERY_START",
        groupId: "my-group-id",
        period: { interval: "week", start: 100, end: 100 },
        query
      });

      let queryKey = stringify(query);
      expect(s2.groupEventQueries["my-group-id"][695]).to.be.undefined;
      expect(s2.groupEventQueries["my-group-id"][696][queryKey])
        .to.equal("FETCHING");
      expect(s2.groupEventQueries["my-group-id"][702][queryKey])
        .to.equal("FETCHING");
      expect(s2.groupEventQueries["my-group-id"][703]).to.be.undefined;
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

      prePop(s, "my-group-id", period);
      s.groupEventQueries["my-group-id"][period.start][queryKey] = oldData;
      s.groupEventQueries["my-group-id"][period.end][queryKey] = "FETCH_ERROR";

      let s2 = eventsDataReducer(deepFreeze(s), {
        type: "GROUP_EVENTS_DATA",
        dataType: "FETCH_QUERY_START",
        groupId: "my-group-id",
        period, query
      });

      // Don't replace data (but do replace FETCH_ERROR)
      expect(s2.groupEventQueries["my-group-id"][period.start][queryKey])
        .to.deep.equal(oldData);
      expect(s2.groupEventQueries["my-group-id"][period.end][queryKey])
        .to.equal("FETCHING");
    });
  });

  describe("when handling FETCH_QUERY_END", () => {
    it("populates groupEventQueries with a list of eventIds for each day",
    () => {
      let now = new Date("2016-11-01");
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
        new Date("2016-10-01"),
        new Date("2016-10-03")
      );
      let query = { labels: { all: true } };
      let s2 = eventsDataReducer(deepFreeze(s), {
        type: "GROUP_EVENTS_DATA",
        dataType: "FETCH_QUERY_END",
        groupId: "my-group-id",
        period, query,
        events: [e1, e2, e3]
      });
      let queryKey = stringify(query);

      // 10-1
      expect(s2.groupEventQueries["my-group-id"][period.start][queryKey])
        .to.deep.equal({
          query,
          eventIds: [e1.id],
          updatedOn: now
        });

      // 10-2
      expect(s2.groupEventQueries["my-group-id"][period.start + 1][queryKey])
        .to.deep.equal({
          query,
          eventIds: [e1.id, e2.id, e3.id],
          updatedOn: now
        });

      // 10-3
      expect(s2.groupEventQueries["my-group-id"][period.end][queryKey])
        .to.deep.equal({
          query,
          eventIds: [e2.id],
          updatedOn: now
        });
    });

    it("does not populate outside specified period",
    () => {
      let then = new Date("2016-10-31");
      let now = new Date("2016-11-01");
      sandbox.useFakeTimers(now.getTime());

      let e1 = makeEvent({ id: "e1",
        start: "2016-10-01T08:00:00.000",
        end:   "2016-10-03T08:00:00.000",
      });

      let s = initState();
      let period = fromDates("day",
        new Date("2016-10-02"),
        new Date("2016-10-02")
      );
      let query = { labels: { all: true } };
      let queryKey = stringify(query);

      // Prepopulate state a bit more to test that the right things get
      // clobbered
      prePop(s, "my-group-id", period);
      s.groupEventQueries["my-group-id"][period.start - 1][queryKey] = {
        query, eventIds: ["test"], updatedOn: then
      };
      s.groupEventQueries["my-group-id"][period.start][queryKey] = {
        query, eventIds: ["test"], updatedOn: then
      };
      s.groupEventQueries["my-group-id"][period.end + 1][queryKey] = {
        query, eventIds: ["test"], updatedOn: then
      };

      let s2 = eventsDataReducer(deepFreeze(s), {
        type: "GROUP_EVENTS_DATA",
        dataType: "FETCH_QUERY_END",
        groupId: "my-group-id",
        period, query,
        events: [e1]
      });

      // 10-1
      expect(s2.groupEventQueries["my-group-id"][period.start - 1][queryKey])
        .to.deep.equal({ query, eventIds: ["test"], updatedOn: then });

      // 10-2
      expect(s2.groupEventQueries["my-group-id"][period.start][queryKey])
        .to.deep.equal({ query, eventIds: [e1.id], updatedOn: now });

      // 10-3
      expect(s2.groupEventQueries["my-group-id"][period.end + 1][queryKey])
        .to.deep.equal({ query, eventIds: ["test"], updatedOn: then });
    });

    it("populates groupEvents with updated event data",  () => {
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
      s.groupEvents["my-group-id"] = {
        "e1": oldE1,
        "e3": oldE3
      };

      let period = fromDates("day",
        new Date("2016-10-02"),
        new Date("2016-10-04")
      );
      let query = { labels: { all: true } };
      let s2 = eventsDataReducer(deepFreeze(s), {
        type: "GROUP_EVENTS_DATA",
        dataType: "FETCH_QUERY_END",
        groupId: "my-group-id",
        period, query,
        events: [e1, e2]
      });

      expect(s2.groupEvents["my-group-id"][e1.id]).to.deep.equal(e1);
      expect(s2.groupEvents["my-group-id"][e2.id]).to.deep.equal(e2);
      expect(s2.groupEvents["my-group-id"][oldE3.id]).to.deep.equal(oldE3);
    });
  });

  describe("when handling FETCH_QUERY_FAIL", () => {
    it("marks groupEventQueries with FETCH_ERROR", () => {
      let s = initState();
      let period = fromDates("day",
        new Date("2016-10-01"),
        new Date("2016-10-02")
      );
      let query = { labels: { all: true } };
      let s2 = eventsDataReducer(deepFreeze(s), {
        type: "GROUP_EVENTS_DATA",
        dataType: "FETCH_QUERY_FAIL",
        groupId: "my-group-id",
        period, query
      });
      let queryKey = stringify(query);

      expect(s2.groupEventQueries["my-group-id"][period.start - 1])
        .to.be.undefined;
      expect(s2.groupEventQueries["my-group-id"][period.start][queryKey])
        .to.equal("FETCH_ERROR");
      expect(s2.groupEventQueries["my-group-id"][period.end][queryKey])
        .to.equal("FETCH_ERROR");
      expect(s2.groupEventQueries["my-group-id"][period.end + 1])
        .to.be.undefined;
    });

    it("does not clobber existing data with FETCH_ERROR", () => {
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
      };

      prePop(s, "my-group-id", period);
      s.groupEventQueries["my-group-id"][period.start][queryKey] = oldData;
      s.groupEventQueries["my-group-id"][period.end][queryKey] = "FETCHING";

      let s2 = eventsDataReducer(deepFreeze(s), {
        type: "GROUP_EVENTS_DATA",
        dataType: "FETCH_QUERY_FAIL",
        groupId: "my-group-id",
        period, query
      });

      // Don't replace data (but do replace FETCHING)
      expect(s2.groupEventQueries["my-group-id"][period.start][queryKey])
        .to.deep.equal(oldData);
      expect(s2.groupEventQueries["my-group-id"][period.end][queryKey])
        .to.equal("FETCH_ERROR");
    });
  });

  describe("when handling PUSH", () => {
    it("replaces event data", () => {
      let e1a = makeEvent({ id: "e1",
        start: "2016-10-01T08:00:00.000",
        end:   "2016-10-02T08:00:00.000",
      });
      let e1b = makeEvent({ id: "e1",
        start: "2016-10-02T09:00:00.000",
        end:   "2016-10-03T02:00:00.000",
      });

      let s = initState();
      s.groupEvents["my-group-id"] = { "e1": e1a };

      let s2 = eventsDataReducer(deepFreeze(s), {
        type: "GROUP_EVENTS_DATA",
        dataType: "PUSH",
        groupId: "my-group-id",
        events: [e1b]
      });
      expect(s2.groupEvents["my-group-id"]["e1"]).to.deep.equal(e1b);
    });

    it("invalidates event queries", () => {
      let s = initState();
      let period = fromDates("day",
        new Date("2016-10-01"),
        new Date("2016-10-03")
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

      prePop(s, "my-group-id", period);
      let queryDays = s.groupEventQueries["my-group-id"];
      queryDays[period.start][queryKey1] = _.clone(oldData1);
      queryDays[period.start + 1][queryKey1] = _.clone(oldData1);
      queryDays[period.start + 1][queryKey2] = _.clone(oldData2);
      queryDays[period.end][queryKey1] = _.clone(oldData1);
      queryDays[period.end + 1][queryKey1] = _.clone(oldData1);

      let e1 = makeEvent({ id: "e1",
        start: "2016-10-02T08:00:00.000",
        end:   "2016-10-03T08:00:00.000",
      });
      let s2 = eventsDataReducer(deepFreeze(s), {
        type: "GROUP_EVENTS_DATA",
        dataType: "PUSH",
        groupId: "my-group-id",
        events: [e1]
      });

      queryDays = s2.groupEventQueries["my-group-id"];
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
    });
  });

  describe("when handling FETCH_IDS_START", () => {
    it("sets FETCHING For given ids", () => {
      let s = initState();
      let s2 = eventsDataReducer(deepFreeze(s), {
        type: "GROUP_EVENTS_DATA",
        dataType: "FETCH_IDS_START",
        groupId: "my-group-id",
        eventIds: ["id1", "id2"]
      });
      expect(s2.groupEvents['my-group-id']["id1"]).to.equal("FETCHING");
      expect(s2.groupEvents['my-group-id']["id2"]).to.equal("FETCHING");
    });

    it("replaces FETCH_ERROR but does not replace existing data with FETCHING",
    () => {
      let s = initState();
      let e2 = makeEvent({ id: "id2" })
      s.groupEvents['my-group-id'] = {
        id1: "FETCH_ERROR",
        id2: e2
      };
      let s2 = eventsDataReducer(deepFreeze(s), {
        type: "GROUP_EVENTS_DATA",
        dataType: "FETCH_IDS_START",
        groupId: "my-group-id",
        eventIds: ["id1", "id2"]
      });
      expect(s2.groupEvents['my-group-id']["id1"]).to.equal("FETCHING");
      expect(s2.groupEvents['my-group-id']["id2"]).to.deep.equal(e2);
    });
  });

  describe("when handling FETCH_IDS_END", () => {
    it("replaces existing items with data", () => {
      let s = initState();
      let e1 = makeEvent({ id: "id1" });
      let e2 = makeEvent({ id: "id2" });
      let e3a = makeEvent({ id: "id3", title: "Old" });
      let e3b = makeEvent({ id: "id3", title: "New" });
      s.groupEvents['my-group-id'] = {
        id1: "FETCHING",
        id3: e3a
      };
      let s2 = eventsDataReducer(deepFreeze(s), {
        type: "GROUP_EVENTS_DATA",
        dataType: "FETCH_IDS_END",
        groupId: "my-group-id",
        eventIds: ["id1", "id2", "id3"],
        events: [e1, e2, e3b]
      });
      expect(s2.groupEvents['my-group-id']["id1"]).to.deep.equal(e1);
      expect(s2.groupEvents['my-group-id']["id2"]).to.deep.equal(e2);
      expect(s2.groupEvents['my-group-id']["id3"]).to.deep.equal(e3b);
    });

    it("sets FETCH_ERROR for each event it was not able to fetch", () => {
      let s = initState();
      let e1 = makeEvent({ id: "id1" });
      let s2 = eventsDataReducer(deepFreeze(s), {
        type: "GROUP_EVENTS_DATA",
        dataType: "FETCH_IDS_END",
        groupId: "my-group-id",
        eventIds: ["id1", "id2"],
        events: [e1]
      });
      expect(s2.groupEvents['my-group-id']["id1"]).to.deep.equal(e1);
      expect(s2.groupEvents['my-group-id']["id2"]).to.equal("FETCH_ERROR");
    });

    it("does not replace existing data with FETCH_ERROR", () => {
      let s = initState();
      let e1 = makeEvent({ id: "id1" });
      s.groupEvents['my-group-id'] = { id1: e1 };
      let s2 = eventsDataReducer(deepFreeze(s), {
        type: "GROUP_EVENTS_DATA",
        dataType: "FETCH_IDS_END",
        groupId: "my-group-id",
        eventIds: ["id1"],
        events: []
      });
      expect(s2.groupEvents['my-group-id']["id1"]).to.deep.equal(e1);
    });
  });
});