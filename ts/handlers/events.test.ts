import {
  fetchEvents, fetchById, setGroupEventLabels, EventQueues,
  processLabelRequests, processQueueRequest, toggleTimebomb,
  toggleFeedback
} from "./events";
import { LabelQueues as GroupLabelQueues } from "./groups";
import { expect } from "chai";
import { ApiSvc } from "../lib/api";
import * as ApiT from "../lib/apiT";
import { expectCalledWith } from "../lib/expect-helpers";
import { stringify, toAPI } from "../lib/event-queries";
import { bounds, toDays } from "../lib/period";
import { apiSvcFactory,
  stubApi, stubApiPlus, stubApiRet
} from "../fakes/api-fake";
import { initState as initGroupState } from "../states/groups"
import { initState, EventsState, QueryResult } from "../states/events";
import { sandbox } from "../lib/sandbox";
import makeEvent from "../fakes/events-fake";
import { testLabel } from "../fakes/labels-fake";
import * as Sinon from "sinon";

describe("Event handlers", function() {
  // Common vars
  const groupId = "my-group-id";
  const calgroupId = groupId;
  const calgroupType = "group" as "group";

  afterEach(() => {
    EventQueues.reset();
  });

  describe("fetchEvents", function() {
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
    const defaultProps = { calgroupId, calgroupType, period, query };

    // Stubs in some fake event data
    function fakeData(state: EventsState) {
      state.eventQueries[groupId] = [];
      let queryDays = state.eventQueries[groupId];
      for (let i = daysStart; i <= daysEnd; i++) {
        queryDays[i] = {};
        queryDays[i][queryKey] = {
          query, eventIds: ["test-id-1", "test-id-2"],
          updatedOn: new Date()
        };
      }
    }

    it("dispatches a EVENTS_DATA action", () => {
      let deps = getDeps();
      fetchEvents(defaultProps, deps);

      expectCalledWith(deps.dispatch, {
        type: "EVENTS_DATA",
        dataType: "FETCH_QUERY_START",
        calgroupId, periods: [toDays(period)], query
      });
    });

    it("posts API call for groups data", () => {
      let deps = getDeps();
      let apiSpy = sandbox.spy(deps.Svcs.Api, "postForGroupEvents");
      fetchEvents(defaultProps, deps);

      let [start, end] = bounds(period);
      expectCalledWith(apiSpy, groupId, toAPI(start, end, query));
    });

    it("dispatches a FETCH_QUERY_END on succesful return of data", (done) => {
      let e1 = makeEvent({ id: "e1" });
      let e2 = makeEvent({ id: "e2" });

      let deps = getDeps();
      let dfd = stubApi(deps.Svcs, "postForGroupEvents");

      fetchEvents(defaultProps, deps)
      .then(() => {
        expectCalledWith(deps.dispatch, {
          type: "EVENTS_DATA",
          dataType: "FETCH_QUERY_END",
          calgroupId, query,
          period: toDays(period),
          events: [e1, e2]
        });
      }).then(done, done);

      deps.dispatch.reset();
      dfd.resolve({ events: [e1, e2] });
    });

    it("dispatches a FETCH_QUERY_FAIL on API call failure", (done) => {
      let deps = getDeps();
      let dfd = stubApi(deps.Svcs, "postForGroupEvents");

      fetchEvents(defaultProps, deps).then(
        () => {
          expectCalledWith(deps.dispatch, {
            type: "EVENTS_DATA",
            dataType: "FETCH_QUERY_FAIL",
            calgroupId, query,
            period: toDays(period)
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
      fetchEvents(defaultProps, deps);
      expect(deps.dispatch.called).to.be.false;
      expect(apiSpy.called).to.be.false;
    });

    it("returns a promise for when queued fetches are done, even if not " +
       "adding to queue", (done) => {
      let deps = getDeps();
      let { dfd, stub } = stubApiPlus(deps.Svcs, "postForGroupEvents");
      fakeData(deps.state);

      // Request should not make API call, but return promise that resolves
      // when queue does
      fetchEvents(defaultProps, deps).then(() => {
        // Sanity check. Multiple calls but only one API call.
        expect(stub.callCount).to.equal(1);

        // Check that query promise doesn't resolve until query2 does.
        expectCalledWith(deps.dispatch, {
          type: "EVENTS_DATA",
          dataType: "FETCH_QUERY_END",
          calgroupId,
          query: query2,
          period: toDays(period),
          events: []
        });
      }).then(done, done);

      // Queue another request so above promise returns
      let query2 = { contains: "Test" };
      fetchEvents({ ...defaultProps, query: query2 }, deps);
      dfd.resolve({});
    });

    it("does fetch if data missing for any one of dates", () => {
      let deps = getDeps();
      let apiSpy = sandbox.spy(deps.Svcs.Api, "postForGroupEvents");
      fakeData(deps.state);

      delete deps.state.eventQueries[groupId][daysStart + 1];

      fetchEvents(defaultProps, deps);
      expect(deps.dispatch.called).to.be.true;
      expect(apiSpy.called).to.be.true;
    });

    it("does fetch if data missing for query", () => {
      let deps = getDeps();
      let apiSpy = sandbox.spy(deps.Svcs.Api, "postForGroupEvents");
      fakeData(deps.state);

      delete deps.state.eventQueries[groupId][daysStart + 1][queryKey];

      fetchEvents(defaultProps, deps);
      expect(deps.dispatch.called).to.be.true;
      expect(apiSpy.called).to.be.true;
    });

    it("does fetch if any query is invalid", () => {
      let deps = getDeps();
      let apiSpy = sandbox.spy(deps.Svcs.Api, "postForGroupEvents");
      fakeData(deps.state);

      (deps.state.eventQueries
        [groupId][daysStart + 1][queryKey] as QueryResult
      ).invalid = true;

      fetchEvents(defaultProps, deps);
      expect(deps.dispatch.called).to.be.true;
      expect(apiSpy.called).to.be.true;
    });

    it("does fetch if any query is stale", () => {
      let deps = getDeps();
      let apiSpy = sandbox.spy(deps.Svcs.Api, "postForGroupEvents");
      let now = 1480000000000;
      sandbox.useFakeTimers(now)
      fakeData(deps.state);

      (deps.state.eventQueries
        [groupId][daysStart + 1][queryKey] as QueryResult
      ).updatedOn = new Date(now - (30 * 1000 + 1));

      fetchEvents(defaultProps, deps);
      expect(deps.dispatch.called).to.be.true;
      expect(apiSpy.called).to.be.true;
    });

    it("trims fetch period to minimum invalid for API call", () => {
      let deps = getDeps();
      let apiSpy = sandbox.spy(deps.Svcs.Api, "postForGroupEvents");
      fakeData(deps.state);

      (deps.state.eventQueries
        [groupId][daysStart + 1][queryKey] as QueryResult
      ).invalid = true;
      (deps.state.eventQueries
        [groupId][daysStart + 3][queryKey] as QueryResult
      ).invalid = true;

      let [start, end] = bounds({
        interval: "day",
        start: daysStart + 1,
        end: daysStart + 3
      });

      fetchEvents(defaultProps, deps);
      expectCalledWith(apiSpy, groupId, toAPI(start, end, query));
    });

    it("trims fetch period for FETCH_QUERY_END dispatch", (done) => {
      let e1 = makeEvent({ id: "e1" });
      let e2 = makeEvent({ id: "e2" });
      let deps = getDeps();

      fakeData(deps.state);
      (deps.state.eventQueries
        [groupId][daysStart + 1][queryKey] as QueryResult
      ).invalid = true;
      (deps.state.eventQueries
        [groupId][daysStart + 3][queryKey] as QueryResult
      ).invalid = true;

      let dfd = stubApi(deps.Svcs, "postForGroupEvents");

      fetchEvents(defaultProps, deps).then(() => {
        expectCalledWith(deps.dispatch, {
          type: "EVENTS_DATA",
          dataType: "FETCH_QUERY_END",
          calgroupId, query,
          period: {
            interval: "day",
            start: daysStart + 1,
            end: daysStart + 3
          },
          events: [e1, e2]
        });
      }).then(done, done);

      deps.dispatch.reset();
      dfd.resolve({ events: [e1, e2] });
    });

    it("enqueues multiple fetch periods based on Conf.maxDaysFetch", () => {
      let deps = getDeps();
      (deps.Conf as any).maxDaysFetch = 5;
      let queue = EventQueues.get(groupId);
      let spy = sandbox.spy(queue, 'enqueue');

      fetchEvents(defaultProps, deps);

      expect(spy.getCall(0).args[0].period).to.deep.equal({
        interval: "day", start: daysStart, end: daysStart + 4
      });
      expect(spy.getCall(1).args[0].period).to.deep.equal({
        interval: "day", start: daysStart + 5, end: daysStart + 9
      });
      expect(spy.getCall(2).args[0].period).to.deep.equal({
        interval: "day", start: daysStart + 10, end: daysStart + 13
      });
    });
  });

  describe("fetchById", () => {
    // Common vars
    const event1 = makeEvent({ id: "e1" });
    const event2 = makeEvent({ id: "e2" });
    function getDeps() {
      return {
        dispatch: sandbox.spy(),
        state: initState(),
        Svcs: apiSvcFactory()
      };
    }
    const defaultProps = { calgroupId, calgroupType, eventId: event1.id };

    it("dispatches FETCH_IDS_START", () => {
      let deps = getDeps();
      fetchById(defaultProps, deps);
      expectCalledWith(deps.dispatch, {
        type: "EVENTS_DATA",
        dataType: "FETCH_IDS_START",
        calgroupId,
        eventIds: [event1.id]
      });
    });

    it("makes an API call to fetch event if none available", () => {
      let deps = getDeps();
      let spy = sandbox.spy(deps.Svcs.Api, "getGroupEvent");
      fetchById(defaultProps, deps);
      expectCalledWith(spy, groupId, event1.id);
    });

    it("does not make an API call if event already exists", () => {
      let deps = getDeps();
      deps.state.events = {
        [groupId]: {
          [event1.id]: event1
        }
      };

      let spy = sandbox.spy(deps.Svcs.Api, "getGroupEvent");
      fetchById(defaultProps, deps);
      expect(spy.called).to.be.false;
      expect(deps.dispatch.called).to.be.false;
    });

    describe("when API call returns event with same ID", () => {
      function getDeps2() {
        let deps = getDeps();
        stubApiRet(deps.Svcs, "getGroupEvent", event1);
        return deps;
      }

      it("dispatches returned event", (done) => {
        let deps = getDeps2();
        let onNewId = Sinon.spy();
        fetchById(defaultProps, deps, { onNewId }).then(
        () => {
          expectCalledWith(deps.dispatch, {
            type: "EVENTS_DATA",
            dataType: "FETCH_IDS_END",
            calgroupId,
            eventIds: [event1.id],
            events: [event1]
          });

          // onNewId not called
          expect(onNewId.called).to.be.false;
        }).then(done, done);
      });
    });

    describe("when API call returns event with different ID", () => {
      function getDeps2() {
        let deps = getDeps();
        stubApiRet(deps.Svcs, "getGroupEvent", event2);
        return deps;
      }

      it("dispatches returned event and calls onNewId function", (done) => {
        let deps = getDeps2();
        let onNewId = Sinon.spy();
        fetchById(defaultProps, deps, { onNewId }).then(
        () => {
          expectCalledWith(deps.dispatch, {
            type: "EVENTS_DATA",
            dataType: "FETCH_IDS_END",
            calgroupId,
            eventIds: [event1.id],
            events: [event2]
          });

          // onNewId called
          expectCalledWith(onNewId, event2.id);
        }).then(done, done);
      });
    });
  });

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
          events: {
            [groupId]: {
              e1: makeEvent({ id: "e1" }),
              e2: makeEvent({
                id: "e2",
                labels: [label2]
              })
            }
          }
        },
        Svcs: apiSvcFactory(),
        postTask: sandbox.spy()
      };
    }

    // Common vars
    const eventIds = ["e1", "e2"];
    const label1 = testLabel("L1");
    const label2 = testLabel("L2");

    afterEach(() => {
      GroupLabelQueues.reset();
    });

    it("dispatches a EVENTS_UPDATE action when adding", () => {
      let deps = getDeps();
      setGroupEventLabels({
        groupId,
        eventIds,
        label: label1,
        active: true
      }, deps);

      expectCalledWith(deps.dispatch, {
        type: "EVENTS_UPDATE",
        calgroupId,
        eventIds,
        recurringEventIds: [],
        addLabels: [label1],
        rmLabels: [],
        hidden: false
      });
    });

    it("dispatches a EVENTS_UPDATE action when removing", () => {
      let deps = getDeps();
      setGroupEventLabels({
        groupId,
        eventIds,
        label: label1,
        active: false
      }, deps);

      expectCalledWith(deps.dispatch, {
        type: "EVENTS_UPDATE",
        calgroupId,
        eventIds,
        recurringEventIds: [],
        addLabels: [],
        rmLabels: [label1],
        hidden: false
      });
    });

    it("makes API call to set event labels", (done) => {
      let deps = getDeps();
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
            labels: [label1.original],
            hidden: false
          }, {
            id: "e2",
            labels: [label1.original, label2.original],
            hidden: false
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

    it("dispatches action to hide events", () => {
      let deps = getDeps();
      setGroupEventLabels({
        groupId,
        eventIds,
        hidden: true
      }, deps);

      expectCalledWith(deps.dispatch, {
        type: "EVENTS_UPDATE",
        calgroupId,
        eventIds,
        recurringEventIds: [],
        addLabels: [],
        rmLabels: [],
        hidden: true
      });
    });

    it("makes API call to hide event", (done) => {
      let deps = getDeps();
      let { stub, dfd } = stubApiPlus(deps.Svcs, "setPredictGroupLabels");
      setGroupEventLabels({
        groupId,
        eventIds,
        hidden: true
      }, deps).then(() => {
        expectCalledWith(stub, groupId, {
          set_labels: [{
            id: "e1",
            hidden: true
          }, {
            id: "e2",
            hidden: true
          }],
          predict_labels: []
        })
      }).then(done, done);
      dfd.resolve({});
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

    it("dispatches confirmation of existing labels if none provided", () => {
      let deps = getDeps();
      setGroupEventLabels({
        groupId,
        eventIds
      }, deps);

      expectCalledWith(deps.dispatch, {
        type: "EVENTS_UPDATE",
        calgroupId,
        eventIds,
        recurringEventIds: [],
        addLabels: [],
        rmLabels: []
      });
    });

    it("makes an API call to confirm existing labels if none provided but " +
       "only if event needs confirmation",
    (done) => {
      let deps = getDeps();
      let { stub, dfd } = stubApiPlus(deps.Svcs, "setPredictGroupLabels");

      deps.state.events[groupId].e1.labels_confirmed = true;
      deps.state.events[groupId].e2.labels_confirmed = false;

      setGroupEventLabels({
        groupId,
        eventIds
      }, deps).then(() => {
        expectCalledWith(stub, groupId, {
          set_labels: [{
            id: "e2",
            labels: [label2.original],
            hidden: false
          }],
          predict_labels: []
        })
      }).then(done, done);
      dfd.resolve({});
    });

    it("makes an API call to hide events if confirmation needed", (done) => {
      let deps = getDeps();
      let { stub, dfd } = stubApiPlus(deps.Svcs, "setPredictGroupLabels");

      deps.state.events[groupId].e1.labels_confirmed = true;
      deps.state.events[groupId].e1.hidden = true;
      deps.state.events[groupId].e2.labels_confirmed = false;
      deps.state.events[groupId].e2.hidden = true;

      setGroupEventLabels({
        groupId,
        eventIds
      }, deps).then(() => {
        expectCalledWith(stub, groupId, {
          set_labels: [{
            id: "e2",
            hidden: true
          }],
          predict_labels: []
        })
      }).then(done, done);
      dfd.resolve({});
    });

    describe("with recurring events", () => {
      function getRecurringDeps() {
        let deps = getDeps();
        return {
          ...deps,
          state: {
            ...deps.state,
            events: {
              [groupId]: {
                ...deps.state.events[groupId],
                e4: makeEvent({
                  id: "e4",
                  recurring_event_id: "recurId"
                }),
                e5: makeEvent({
                  id: "e5",
                  recurring_event_id: "recurId"
                })
              }
            },
            recurringEvents: {
              [groupId]: {
                recurId: { e4: true as true, e5: true as true }
              }
            }
          }
        }
      }

      it("dispatches an action with a recurring ID if relevant", () => {
        let deps = getRecurringDeps();
        setGroupEventLabels({
          groupId,
          eventIds: ["e1", "e4", "e5"],
          label: label1,
          active: true
        }, deps);

        expectCalledWith(deps.dispatch, {
          type: "EVENTS_UPDATE",
          calgroupId,
          eventIds: ["e1"],
          recurringEventIds: ["recurId"],
          addLabels: [label1],
          rmLabels: [],
          hidden: false // Any label action sets hidden to false by default
        });
      });

      it("makes an API call with a recurring ID if relevant", (done) => {
        let deps = getRecurringDeps();
        let { stub, dfd } = stubApiPlus(deps.Svcs, "setPredictGroupLabels");

        setGroupEventLabels({
          groupId,
          eventIds: ["e1", "e4", "e5"],
          label: label1,
          active: true
        }, deps).then(() => {
          expectCalledWith(stub, groupId, {
            set_labels: [{
              id: "e1",
              labels: [label1.original],
              hidden: false
            }, {
              id: "recurId",
              labels: [label1.original],
              hidden: false
            }],
            predict_labels: []
          })
        }).then(done, done);
        dfd.resolve({});
      });

      it("accepts an option to force recurring events to be labeled as an " +
         "instance",
      (done) => {
        let deps = getRecurringDeps();
        let { stub, dfd } = stubApiPlus(deps.Svcs, "setPredictGroupLabels");

        setGroupEventLabels({
          groupId,
          eventIds: ["e4"],
          label: label1,
          active: true
        }, deps, { forceInstance: true }).then(() => {
          expectCalledWith(stub, groupId, {
              set_labels: [{
                id: "e4",
                labels: [label1.original],
                hidden: false
              }],
              predict_labels: []
            })
          }).then(done, done);

        expectCalledWith(deps.dispatch, {
          type: "EVENTS_UPDATE",
          calgroupId,
          eventIds: ["e4"],
          recurringEventIds: [],
          addLabels: [label1],
          rmLabels: [],
          hidden: false
        });

        dfd.resolve({});
      });

      describe("with a period-query context", () => {
        const period = { interval: "day" as "day", start: 1000, end: 1012 };
        const query = { contains: "Test" };
        const context = { period, query };

        it("dispatches a GROUP_CALC_START action ", () => {
          let deps = getDeps();
          setGroupEventLabels({
            groupId,
            eventIds: ["e1"],
            label: label1,
            active: true,
            context
          }, deps);
          expectCalledWith(deps.dispatch, {
            type: "GROUP_CALC_START",
            groupId, period, query
          });
        });

        it("posts a GROUP_QUERY_CALC task after promise resolves",
        (done) => {
          let deps = getDeps();
          let { dfd } = stubApiPlus(deps.Svcs, "setPredictGroupLabels");

          setGroupEventLabels({
            groupId,
            eventIds: ["e1"],
            label: label1,
            active: true,
            context
          }, deps).then(() => {
            expectCalledWith(deps.postTask, {
              type: "GROUP_QUERY_CALC",
              groupId, period, query
            });
          }).then(done, done);

          dfd.resolve({});
        });
      });
    });
  });


  // Helpers for testing queue request processing
  interface Deps { Svcs: ApiSvc; dispatch: Sinon.SinonSpy; };
  function getDeps(): Deps {
    return {
      Svcs: apiSvcFactory(),
      dispatch: sandbox.spy()
    };
  }

  function makeLabelRequest(deps?: Deps) {
    return {
      type: "LABEL" as "LABEL",
      calgroupType: "group" as "group",
      setLabels: [],
      predictLabels: [],
      deps: deps || getDeps()
    };
  };

  function makeQueryRequest(deps?: Deps) {
    return {
      type: "FETCH_QUERY" as "FETCH_QUERY",
      calgroupType: "group" as "group",
      period: { interval: "day" as "day", start: 1000, end: 1014 },
      query: {},
      priority: 123,
      deps: deps || getDeps()
    }
  }

  describe("processQueueRequest", () => {
    it("processes push requests before fetch requests", (done) => {
      let deps = getDeps();
      let fetch1 = makeQueryRequest(deps);
      let fetch2 = makeQueryRequest(deps);
      let push1 = makeLabelRequest(deps);

      // Stub all API calls to resolve right away
      let labelStub = stubApiRet(deps.Svcs, "setPredictGroupLabels");

      processQueueRequest("group-id", [
        fetch1,
        push1,
        fetch2
      ]).then((ret) => {
        expect(labelStub.callCount).to.equal(1);
        expect(ret).to.deep.equal([fetch1, fetch2]);
      }).then(done, done);
    });

    it("processes fetch requests in descending priority", (done) => {
      let deps = getDeps();
      let fetch1 = { ...makeQueryRequest(deps), priority: 1 };
      let fetch2 = { ...makeQueryRequest(deps), priority: 2 };
      let fetch3 = { ...makeQueryRequest(deps),
        query: {contains: "Test 3"},
        priority: 3
      };
      let fetchStub = stubApiRet(deps.Svcs, "postForGroupEvents", {
        "cal-id": { events: [] }
      });

      processQueueRequest("group-id", [
        fetch1,
        fetch3,
        fetch2
      ]).then((ret) => {
        expect(fetchStub.getCall(0).args[1].contains).to.equal("Test 3");
        expect(ret).to.deep.equal([fetch2, fetch1]);
      }).then(done, done);
    });
  });

  describe("processLabelRequests", () => {
    var labelStub: Sinon.SinonStub;
    var deps: Deps;

    beforeEach(() => {
      deps = getDeps();
      labelStub = stubApiRet(deps.Svcs, "setPredictGroupLabels");
    });

    it("includes last set of labels for each event id in API call", (done) => {
      processLabelRequests(groupId, [{
        ...makeLabelRequest(deps),
        setLabels: [{
          id: "e1",
          labels: ["L1"]
        }, {
          id: "e2",
          labels: ["L1"]
        }]
      }, {
        ...makeLabelRequest(deps),
        setLabels: [{
          id: "e1",
          labels: ["L2", "L3"]
        }]
      }]).then(() => {
        expectCalledWith(labelStub, groupId, {
          set_labels: [{
            id: "e1",
            labels: ["L2", "L3"],
            hidden: false
          }, {
            id: "e2",
            labels: ["L1"],
            hidden: false
          }],
          predict_labels: []
        });
      }).then(done, done);
    });

    it("ignores labels when setting hidden to true", (done) => {
      processLabelRequests(groupId, [{
        ...makeLabelRequest(deps),
        setLabels: [{
          id: "e1",
          labels: ["L1"],
          hidden: true
        }]
      }]).then(() => {
        expectCalledWith(labelStub, groupId, {
          set_labels: [{
            id: "e1",
            hidden: true
          }],
          predict_labels: []
        });
      }).then(done, done);
    });

    it("unsets hidden when settings any labels", (done) => {
      processLabelRequests(groupId, [{
        ...makeLabelRequest(deps),
        setLabels: [{
          id: "e1",
          hidden: true
        }]
      }, {
        ...makeLabelRequest(deps),
        setLabels: [{
          id: "e1",
          labels: ["L1"],
          hidden: false
        }]
      }]).then(() => {
        expectCalledWith(labelStub, groupId, {
          set_labels: [{
            id: "e1",
            labels: ["L1"],
            hidden: false
          }],
          predict_labels: []
        });
      }).then(done, done);
    });

    it("merges predict_labels field", (done) => {
      processLabelRequests(groupId, [{
        ...makeLabelRequest(deps),
        setLabels: [{
          id: "e1",
          labels: ["L1"]
        }],
        predictLabels: ["e3", "e4"]
      }, {
        ...makeLabelRequest(deps),
        setLabels: [{
          id: "e2",
          hidden: true
        }]
      }, {
        ...makeLabelRequest(deps),
        predictLabels: ["e4", "e5"]
      }]).then(() => {
        expectCalledWith(labelStub, groupId, {
          set_labels: [{
            id: "e1",
            labels: ["L1"],
            hidden: false
          }, {
            id: "e2",
            hidden: true
          }],
          predict_labels: ["e3", "e4", "e5"]
        });
      }).then(done, done);
    });
  });

  describe("toggleTimebomb", () => {
    const calgroupId = "my-team-id";
    const calgroupType = "team";
    const login = { uid: "uid" } as ApiT.LoginResponse;
    const getDeps = (event: ApiT.Event) => ({
      Svcs: apiSvcFactory(),
      dispatch: sandbox.spy(),
      state: {
        ...initState(),
        events: {
          [calgroupId]: {
            [event.id]: event
          }
        },
        login
      }
    });

    describe("with a Stage0 event", () => {
      const event = makeEvent({
        timebomb: ["Stage0", { set_by: "2099-01-01" }]
      });

      it("dispatches EVENTS_UPDATE with timebombPref", () => {
        let deps = getDeps(event);
        toggleTimebomb({
          calgroupId,
          calgroupType,
          eventId: event.id,
          value: true
        }, deps);

        expectCalledWith(deps.dispatch, {
          type: "EVENTS_UPDATE",
          calgroupId,
          eventIds: [event.id],
          recurringEventIds: [],
          timebombPref: true
        });
      });

      it("makes API call to set timebomb", async () => {
        let deps = getDeps(event);
        let { dfd, stub } = stubApiPlus(deps.Svcs, "setTeamTimebomb");
        dfd.resolve({});

        await toggleTimebomb({
          calgroupId,
          calgroupType,
          eventId: event.id,
          value: false
        }, deps);

        expectCalledWith(stub, calgroupId, event.id, false);
      });
    });

    describe("with a recurring Stage0 event", () => {
      const event = makeEvent({
        recurring_event_id: "recur-id",
        timebomb: ["Stage0", { set_by: "2099-01-01" }]
      });

      it("dispatches EVENTS_UPDATE with timebombPref and recurring ID", () => {
        let deps = getDeps(event);
        toggleTimebomb({
          calgroupId,
          calgroupType,
          eventId: event.id,
          value: false
        }, deps);

        expectCalledWith(deps.dispatch, {
          type: "EVENTS_UPDATE",
          calgroupId,
          eventIds: [],
          recurringEventIds: [event.recurring_event_id],
          timebombPref: false
        });
      });

      it("makes API call to set timebomb with recurring ID", async () => {
        let deps = getDeps(event);
        let { dfd, stub } = stubApiPlus(deps.Svcs, "setTeamTimebomb");
        dfd.resolve({});

        await toggleTimebomb({
          calgroupId,
          calgroupType,
          eventId: event.id,
          value: true
        }, deps);

        expectCalledWith(stub, calgroupId, event.recurring_event_id, true);
      });

      it("makes an API call to set with event ID if force instance",
      async () => {
        let deps = getDeps(event);
        let { dfd, stub } = stubApiPlus(deps.Svcs, "setTeamTimebomb");
        dfd.resolve({});

        await toggleTimebomb({
          calgroupId,
          calgroupType,
          eventId: event.id,
          value: true
        }, deps, { forceInstance: true });

        expectCalledWith(stub, calgroupId, event.id, true);
      });

      it("makes an API call to set with event ID if event already using " +
      "instance pref", async () => {
        let deps = getDeps({ ...event, timebomb_pref: false });
        let { dfd, stub } = stubApiPlus(deps.Svcs, "setTeamTimebomb");
        dfd.resolve({});

        await toggleTimebomb({
          calgroupId,
          calgroupType,
          eventId: event.id,
          value: true
        }, deps);

        expectCalledWith(stub, calgroupId, event.id, true);
      });
    });

    describe("when setting Stage1 event to true", () => {
      const event = makeEvent({
        timebomb: ["Stage1", {
          contributors: [],
          confirm_by: "2099-01-01"
        }]
      });

      beforeEach(() => {
        sandbox.useFakeTimers(1499724037730);
      })

      it("dispatches EVENTS_UPDATE with timebomb val", () => {
        let deps = getDeps(event);
        toggleTimebomb({
          calgroupId,
          calgroupType,
          eventId: event.id,
          value: true
        }, deps);

        expectCalledWith(deps.dispatch, {
          type: "EVENTS_UPDATE",
          calgroupId,
          eventIds: [event.id],
          timebomb: ["Stage1", {
            contributors: [{
              uid: "uid",
              contributes: true,
              last_edit: (new Date()).toISOString()
            }],
            confirm_by: "2099-01-01"
          }]
        });
      });

      it("makes API call to confirm timebomb with event ID", async () => {
        let deps = getDeps(event);
        let { dfd, stub } = stubApiPlus(deps.Svcs, "confirmTeamEvent");
        dfd.resolve({});

        await toggleTimebomb({
          calgroupId,
          calgroupType,
          eventId: event.id,
          value: true
        }, deps);

        expectCalledWith(stub, calgroupId, event.id);
      });

      it("ignores recurring events", async () => {
        let deps = getDeps({
          ...event,
          recurring_event_id: "recur",
          recurring_timebomb_pref: true
        });
        let { dfd, stub } = stubApiPlus(deps.Svcs, "confirmTeamEvent");
        dfd.resolve({});

        await toggleTimebomb({
          calgroupId,
          calgroupType,
          eventId: event.id,
          value: true
        }, deps);

        expectCalledWith(stub, calgroupId, event.id);
      });
    });

    describe("when setting Stage1 event to false", () => {
      const event = makeEvent({
        timebomb: ["Stage1", {
          contributors: [{
            uid: "uid",
            contributes: true,
            last_edit: "2016-10-01"
          }, {
            uid: "other-uid",
            contributes: true,
            last_edit: "2016-10-01"
          }],
          confirm_by: "2099-01-01"
        }]
      });

      it("dispatches EVENTS_UPDATE with contributor removed", () => {
        let deps = getDeps(event);
        toggleTimebomb({
          calgroupId,
          calgroupType,
          eventId: event.id,
          value: false
        }, deps);

        expectCalledWith(deps.dispatch, {
          type: "EVENTS_UPDATE",
          calgroupId,
          eventIds: [event.id],
          timebomb: ["Stage1", {
            contributors: [{
              uid: "other-uid",
              contributes: true,
              last_edit: "2016-10-01"
            }],
            confirm_by: "2099-01-01"
          }]
        });
      });

      it("makes API call to unconfirm timebomb with event ID", async () => {
        let deps = getDeps(event);
        let { dfd, stub } = stubApiPlus(deps.Svcs, "unconfirmTeamEvent");
        dfd.resolve({});

        await toggleTimebomb({
          calgroupId,
          calgroupType,
          eventId: event.id,
          value: false
        }, deps);

        expectCalledWith(stub, calgroupId, event.id);
      });
    });
  });

  describe("toggleFeedback", () => {
    const calgroupId = "my-team-id";
    const calgroupType = "team";
    const event = makeEvent();
    const getDeps = (event: ApiT.Event) => ({
      Svcs: apiSvcFactory(),
      dispatch: sandbox.spy(),
      state: {
        ...initState(),
        events: {
          [calgroupId]: {
            [event.id]: event
          }
        }
      }
    });

    it("dispatches EVENTS_UPDATE with feedbackPref", () => {
      let deps = getDeps(event);
      toggleFeedback({
        calgroupId,
        calgroupType,
        eventId: event.id,
        value: true
      }, deps);

      expectCalledWith(deps.dispatch, {
        type: "EVENTS_UPDATE",
        calgroupId,
        eventIds: [event.id],
        recurringEventIds: [],
        feedbackPref: true
      });
    });

    it("makes API call to set feedback prefs", async () => {
      let deps = getDeps(event);
      let { dfd, stub } = stubApiPlus(deps.Svcs, "setTeamFeedbackPref");
      dfd.resolve({});

      await toggleFeedback({
        calgroupId,
        calgroupType,
        eventId: event.id,
        value: false
      }, deps);

      expectCalledWith(stub, calgroupId, event.id, false);
    });

    describe("with recurring events", () => {
      const event = makeEvent({
        recurring_event_id: "recur-id"
      });

      it("dispatches EVENTS_UPDATE with recurring event ID", () => {
        let deps = getDeps(event);
        toggleFeedback({
          calgroupId,
          calgroupType,
          eventId: event.id,
          value: false
        }, deps);

        expectCalledWith(deps.dispatch, {
          type: "EVENTS_UPDATE",
          calgroupId,
          eventIds: [],
          recurringEventIds: [event.recurring_event_id],
          feedbackPref: false
        });
      });

      it("makes API call with recurring ID to set feedback prefs", async () => {
        let deps = getDeps(event);
        let { dfd, stub } = stubApiPlus(deps.Svcs, "setTeamFeedbackPref");
        dfd.resolve({});

        await toggleFeedback({
          calgroupId,
          calgroupType,
          eventId: event.id,
          value: true
        }, deps);

        expectCalledWith(stub, calgroupId, event.recurring_event_id, true);
      });

      it("uses event instance ID if forceInstance set", async () => {
        let deps = getDeps(event);
        let { dfd, stub } = stubApiPlus(deps.Svcs, "setTeamFeedbackPref");
        dfd.resolve({});

        await toggleFeedback({
          calgroupId,
          calgroupType,
          eventId: event.id,
          value: true
        }, deps, { forceInstance: true });

        expectCalledWith(deps.dispatch, {
          type: "EVENTS_UPDATE",
          calgroupId,
          eventIds: [event.id],
          recurringEventIds: [],
          feedbackPref: true
        });
        expectCalledWith(stub, calgroupId, event.id, true);
      });

      it("uses event instance ID if already instance pref", async () => {
        let deps = getDeps({ ...event, feedback_pref: false });
        let { dfd, stub } = stubApiPlus(deps.Svcs, "setTeamFeedbackPref");
        dfd.resolve({});

        await toggleFeedback({
          calgroupId,
          calgroupType,
          eventId: event.id,
          value: true
        }, deps);

        expectCalledWith(deps.dispatch, {
          type: "EVENTS_UPDATE",
          calgroupId,
          eventIds: [event.id],
          recurringEventIds: [],
          feedbackPref: true
        });
        expectCalledWith(stub, calgroupId, event.id, true);
      });
    });
  });
});