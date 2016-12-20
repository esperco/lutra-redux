import {
  fetchGroupEvents, setGroupEventLabels, LabelQueues, processLabelRequests
} from "./group-events";
import { LabelQueues as GroupLabelQueues } from "./groups";
import { expect } from "chai";
import { ApiSvc } from "../lib/api";
import { expectCalledWith } from "../lib/expect-helpers";
import { stringify, toAPI } from "../lib/event-queries";
import { bounds } from "../lib/period";
import { apiSvcFactory,
  stubApi, stubApiPlus, stubApiRet
} from "../fakes/api-fake";
import { initState as initGroupState } from "../states/groups"
import { initState, EventsState, QueryResult } from "../states/group-events";
import { newLabel, resetColors } from "../lib/event-labels";
import { toDays } from "../lib/period";
import { sandbox } from "../lib/sandbox";
import makeEvent from "../fakes/events-fake";
import * as Sinon from "sinon";

describe("Group Events handlers", function() {
  // Common vars
  const groupId = "my-group-id";

  describe("fetchGroupEvents", function() {
    function getDeps() {
      return {
        dispatch: sandbox.spy(),
        state: initState(),
        Svcs: apiSvcFactory(),
        Conf: { cacheDuration: 30 * 1000 }
      };
    }

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
      expectCalledWith(apiSpy, groupId, toAPI(start, end, query));
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

  // TODO: Pending new PAI calls
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

  describe("setGroupEventLabels", () => {
    function getDeps() {
      return {
        dispatch: sandbox.spy(),
        state: {
          ...initState(),
          ...initGroupState(),
          groupLabels: {
            [groupId]: { group_labels: [label1] }
          },
          groupEvents: {
            [groupId]: {
              e1: makeEvent({ id: "e1" }),
              e2: makeEvent({
                id: "e2",
                labels: [label2]
              }),
              e3: makeEvent({
                id: "e3",
                labels: [label2],
                hashtags: [{ hashtag }]
              })
            }
          }
        },
        Svcs: apiSvcFactory()
      };
    }

    // Common vars
    const eventIds = ["e1", "e2"]; // Ignore e3 (hashtag test only)
    const label1 = newLabel("L1");
    const label2 = newLabel("L2");
    const hashtag = newLabel("#Hashtag");

    afterEach(() => {
      LabelQueues.reset();
      GroupLabelQueues.reset();
      resetColors();
    });

    it("dispatches a GROUP_EVENTS_UPDATE action when adding", () => {
      let deps = getDeps();
      setGroupEventLabels({
        groupId,
        eventIds,
        label: label1,
        active: true
      }, deps);

      expectCalledWith(deps.dispatch, {
        type: "GROUP_EVENTS_UPDATE",
        groupId,
        eventIds,
        addLabels: [label1],
        rmLabels: []
      });
    });

    it("dispatches a GROUP_EVENTS_UPDATE action when removing", () => {
      let deps = getDeps();
      setGroupEventLabels({
        groupId,
        eventIds,
        label: label1,
        active: false
      }, deps);

      expectCalledWith(deps.dispatch, {
        type: "GROUP_EVENTS_UPDATE",
        groupId,
        eventIds,
        addLabels: [],
        rmLabels: [label1]
      });
    });

    it("makes API call to update hashtags", (done) => {
      let deps = getDeps();
      let { stub, promise } = stubApiPlus(
        deps.Svcs,
        "updateGroupHashtagStates"
      );
      setGroupEventLabels({
        groupId,
        eventIds: ["e3"],
        label: hashtag,
        active: true
      }, deps);
      promise.then(() => {
        expectCalledWith(stub, groupId, "e3", {
          hashtag_states: [{
            hashtag: hashtag.original,
            approved: true
          }]
        });
      }).then(done, done);
    });

    it("confirms hashtags implicitly", (done) => {
      let deps = getDeps();
      let { stub, promise } = stubApiPlus(
        deps.Svcs,
        "updateGroupHashtagStates"
      );
      setGroupEventLabels({
        groupId,
        eventIds: ["e3"],
        label: label1,
        active: true
      }, deps);

      // Even though hashtag is not the label, it gets confirmed anyway
      // by virtue of just being on event
      promise.then(() => {
        expectCalledWith(stub, groupId, "e3", {
          hashtag_states: [{
            hashtag: hashtag.original,
            approved: true
          }]
        });
      }).then(done, done);
    });

    it("makes API call to set event labels", (done) => {
      let deps = getDeps();
      stubApiRet(deps.Svcs, "updateGroupHashtagStates");
      let { stub, dfd } = stubApiPlus(deps.Svcs, "setPredictGroupLabels");
      setGroupEventLabels({
        groupId,
        eventIds,
        label: label1,
        active: true
      }, deps).then(() => {
        expectCalledWith(stub, groupId, {
          set_labels: [{
            id: "e1",
            labels: [label1.original]
          }, {
            id: "e2",
            labels: [label1.original, label2.original]
          }],
          predict_labels: []
        })
      }).then(done, done);
      dfd.resolve({});
    });

    it("makes API call to set group labels", (done) => {
      let deps = getDeps();
      let { stub, promise } = stubApiPlus(deps.Svcs, "putGroupLabels");

      setGroupEventLabels({
        groupId,
        eventIds,
        label: label2, // Not in group list, so API should be called
        active: true
      }, deps);

      promise.then(() => {
        expect(stub.called).to.be.true;
      }).then(done, done);
    });

    it("handles unknown groups gracefully", () => {
      let deps = getDeps();
      setGroupEventLabels({
        groupId: "not-a-group-id",
        eventIds,
        label: label1,
        active: true
      }, deps);

      // No expectations other than not throwing
    });

    it("handles unknown events gracefully", () => {
      let deps = getDeps();
      setGroupEventLabels({
        groupId,
        eventIds: ["f1"],
        label: label1,
        active: true
      }, deps);

      // No expectations other than not throwing
    });
  });

  describe("processLabelRequests", () => {
    var Svcs: ApiSvc;
    var hashtagStub: Sinon.SinonStub;
    var labelStub: Sinon.SinonStub;
    beforeEach(() => {
      Svcs = apiSvcFactory();
      hashtagStub = stubApiRet(Svcs, "updateGroupHashtagStates");
      labelStub = stubApiRet(Svcs, "setPredictGroupLabels");
    });

    it("includes last set of labels for each event id in API call", (done) => {
      processLabelRequests("group-id", [{
        setLabels: [{
          id: "e1",
          labels: ["L1"]
        }, {
          id: "e2",
          labels: ["L1"]
        }],
        predictLabels: [],
        Svcs
      }, {
        setLabels: [{
          id: "e1",
          labels: ["L2", "L3"]
        }],
        predictLabels: [],
        Svcs
      }]).then(() => {
        expectCalledWith(labelStub, "group-id", {
          set_labels: [{
            id: "e1",
            labels: ["L2", "L3"]
          }, {
            id: "e2",
            labels: ["L1"]
          }],
          predict_labels: []
        });
      }).then(done, done);
    });

    it("merges attend and label requests", (done) => {
      processLabelRequests("group-id", [{
        setLabels: [{
          id: "e1",
          labels: ["L1"],
          attended: true
        }],
        predictLabels: [],
        Svcs
      }, {
        setLabels: [{
          id: "e1",
          attended: false
        }],
        predictLabels: [],
        Svcs
      }]).then(() => {
        expectCalledWith(labelStub, "group-id", {
          set_labels: [{
            id: "e1",
            labels: ["L1"],
            attended: false
          }],
          predict_labels: []
        });
      }).then(done, done);
    });

    it("merges hashtags and labels", (done) => {
      processLabelRequests("group-id", [{
        setLabels: [{
          id: "e1",
          labels: ["L1"],
          hashtags: [{
            hashtag: "#hash1",
            approved: false
          }, {
            hashtag: "#hash2",
            approved: false
          }]
        }],
        predictLabels: [],
        Svcs
      }, {
        setLabels: [{
          id: "e1",
          hashtags: [{
            hashtag: "#hash1",
            approved: true
          }, {
            hashtag: "#hash2",
            approved: false
          }]
        }, {
          id: "e2",
          hashtags: [{
            hashtag: "#hash1",
            approved: true
          }]
        }],
        predictLabels: [],
        Svcs
      }]).then(() => {
        expectCalledWith(hashtagStub, "group-id", "e1", {
          hashtag_states: [{
            hashtag: "#hash1",
            approved: true
          }, {
            hashtag: "#hash2",
            approved: false
          }]
        });

        expectCalledWith(hashtagStub, "group-id", "e2", {
          hashtag_states: [{
            hashtag: "#hash1",
            approved: true
          }]
        });

        expectCalledWith(labelStub, "group-id", {
          set_labels: [{
            id: "e1",
            labels: ["L1"]
          }],
          predict_labels: []
        });
      }).then(done, done);
    });

    it("merges predict_labels field", (done) => {
      processLabelRequests("group-id", [{
        setLabels: [{
          id: "e1",
          labels: ["L1"],
          attended: true
        }],
        predictLabels: ["e2", "e3"],
        Svcs
      }, {
        setLabels: [],
        predictLabels: ["e3", "e4"],
        Svcs
      }]).then(() => {
        expectCalledWith(labelStub, "group-id", {
          set_labels: [{
            id: "e1",
            labels: ["L1"],
            attended: true
          }],
          predict_labels: ["e2", "e3", "e4"]
        });
      }).then(done, done);
    });

    it("returns empty list", (done) => {
      processLabelRequests("group-id", [{
        setLabels: [{
          id: "e1",
          labels: ["L1"]
        }],
        predictLabels: [],
        Svcs
      }]).then((x) => {
        expect(x).to.deep.equal([]);
      }).then(done, done);
    });
  });
});