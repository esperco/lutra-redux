import { fetchGroupEvents } from "./group-events";
import { expect } from "chai";
import { expectCalledWith } from "../lib/expect-helpers";
import { bounds } from "../lib/period";
import { apiSvcFactory, stubApi } from "../fakes/api-fake";
import { initState, EventsState, QueryResult } from "../states/group-events";
import { toDays } from "../lib/period";
import { sandbox } from "../lib/sandbox";
import makeEvent from "../fakes/events-fake";
import * as stringify from "json-stable-stringify";

describe("Group Events handlers", function() {
  function getDeps() {
    return {
      dispatch: sandbox.spy(),
      state: initState(),
      Svcs: apiSvcFactory(),
      Conf: { cacheDuration: 30 * 1000 }
    };
  }

  // Common vars
  const groupId = "my-group-id";

  describe("fetchGroupEvents", function() {

    // Common vars
    const period = { interval: "week" as "week", start: 100, end: 101 };
    const { start: daysStart, end: daysEnd } = toDays(period);
    const query = { labels: { all: true } };
    const queryKey = stringify(query);

    // Stubs in some fake event data
    function fakeData(state: EventsState) {
      state.groupEventQueries[groupId] = [];
      let queryDays = state.groupEventQueries[groupId];
      for (let i = daysStart; i <= daysEnd; i++) {
        queryDays[i] = {};
        queryDays[i][queryKey] = {
          query, eventIds: ["test-id-1", "test-id-2"],
          updatedOn: new Date()
        };
      }
    }

    it("dispatches a GROUP_EVENTS_DATA action", () => {
      let deps = getDeps();
      fetchGroupEvents({ groupId, period, query }, deps);

      expectCalledWith(deps.dispatch, {
        type: "GROUP_EVENTS_DATA",
        dataType: "FETCH_QUERY_START",
        groupId, period, query
      });
    });

    it("posts API call for groups data", () => {
      let deps = getDeps();
      let apiSpy = sandbox.spy(deps.Svcs.Api, "postForGroupEvents");
      fetchGroupEvents({ groupId, period, query }, deps);

      let [start, end] = bounds(period);
      expectCalledWith(apiSpy, groupId, {
        window_start: start.toISOString(),
        window_end: end.toISOString()
      });
    });

    it("dispatches a FETCH_QUERY_END on succesful return of data", (done) => {
      let e1 = makeEvent({ id: "e1" });
      let e2 = makeEvent({ id: "e2" });

      let deps = getDeps();
      let dfd = stubApi(deps.Svcs, "postForGroupEvents");

      fetchGroupEvents({ groupId, period, query }, deps).then(() => {
        expectCalledWith(deps.dispatch, {
          type: "GROUP_EVENTS_DATA",
          dataType: "FETCH_QUERY_END",
          groupId, period, query,
          events: [e1, e2]
        });
      }).then(done, done);

      deps.dispatch.reset();
      dfd.resolve({
        "cal-id": { events: [e1, e2] }
      });
    });

    it("dispatches a FETCH_QUERY_FAIL on API call failure", (done) => {
      let deps = getDeps();
      let dfd = stubApi(deps.Svcs, "postForGroupEvents");

      fetchGroupEvents({ groupId, period, query }, deps).then(
        () => {
          expectCalledWith(deps.dispatch, {
            type: "GROUP_EVENTS_DATA",
            dataType: "FETCH_QUERY_FAIL",
            groupId, period, query
          });
        }
      ).then(done, done);

      deps.dispatch.reset();
      dfd.reject(new Error("Whoops"));
    });

    it("does not fetch if data for all dates in period", () => {
      let deps = getDeps();
      let apiSpy = sandbox.spy(deps.Svcs.Api, "postForGroupEvents");
      fakeData(deps.state);
      fetchGroupEvents({ groupId, period, query }, deps);
      expect(deps.dispatch.called).to.be.false;
      expect(apiSpy.called).to.be.false;
    });

    it("does fetch if data missing for any one of dates", () => {
      let deps = getDeps();
      let apiSpy = sandbox.spy(deps.Svcs.Api, "postForGroupEvents");
      fakeData(deps.state);

      delete deps.state.groupEventQueries[groupId][daysStart + 1];

      fetchGroupEvents({ groupId, period, query }, deps);
      expect(deps.dispatch.called).to.be.true;
      expect(apiSpy.called).to.be.true;
    });

    it("does fetch if data missing for query", () => {
      let deps = getDeps();
      let apiSpy = sandbox.spy(deps.Svcs.Api, "postForGroupEvents");
      fakeData(deps.state);

      delete deps.state.groupEventQueries[groupId][daysStart + 1][queryKey];

      fetchGroupEvents({ groupId, period, query }, deps);
      expect(deps.dispatch.called).to.be.true;
      expect(apiSpy.called).to.be.true;
    });

    it("does fetch if any query is invalid", () => {
      let deps = getDeps();
      let apiSpy = sandbox.spy(deps.Svcs.Api, "postForGroupEvents");
      fakeData(deps.state);

      (deps.state.groupEventQueries
        [groupId][daysStart + 1][queryKey] as QueryResult
      ).invalid = true;

      fetchGroupEvents({ groupId, period, query }, deps);
      expect(deps.dispatch.called).to.be.true;
      expect(apiSpy.called).to.be.true;
    });

    it("does fetch if any query is stale", () => {
      let deps = getDeps();
      let apiSpy = sandbox.spy(deps.Svcs.Api, "postForGroupEvents");
      let now = 1480000000000;
      sandbox.useFakeTimers(now)
      fakeData(deps.state);

      (deps.state.groupEventQueries
        [groupId][daysStart + 1][queryKey] as QueryResult
      ).updatedOn = new Date(now - (30 * 1000 + 1));

      fetchGroupEvents({ groupId, period, query }, deps);
      expect(deps.dispatch.called).to.be.true;
      expect(apiSpy.called).to.be.true;
    });
  });

  //
  //
  // describe("fetchByIds", () => {
  //   // Common vars
  //   const eventIds = ["e1", "e2"];
  //   // const event1 = makeEvent({ id: "e1" });
  //   // const event2 = makeEVent({ id: "e2" });

  //   it("dispatches FETCH_IDS_START", () => {
  //     let deps = getDeps();
  //     fetchByIds({ groupId, eventIds }, deps);
  //     expectCalledWith(deps.dispatch, {
  //       type: "GROUP_EVENTS_DATA",
  //       dataType: "FETCH_IDS_START",
  //       groupId, eventIds
  //     });
  //   });
  // });
});