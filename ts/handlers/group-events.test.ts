import {
  fetchGroupEvents, setGroupEventLabels, EventQueues, processLabelRequests,
  processQueueRequest, processCommentRequests, processDeleteCommentRequest,
  postGroupEventComment, deleteGroupEventComment
} from "./group-events";
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
import { initState, EventsState, QueryResult } from "../states/group-events";
import { sandbox } from "../lib/sandbox";
import makeEvent from "../fakes/events-fake";
import { testLabel } from "../fakes/labels-fake";
import * as Sinon from "sinon";

describe("Group Events handlers", function() {
  // Common vars
  const groupId = "my-group-id";

  afterEach(() => {
    EventQueues.reset();
  });

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
        groupId, periods: [toDays(period)], query
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
          groupId, query,
          period: toDays(period),
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
            groupId, query,
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

    it("trims fetch period to minimum invalid for API call", () => {
      let deps = getDeps();
      let apiSpy = sandbox.spy(deps.Svcs.Api, "postForGroupEvents");
      fakeData(deps.state);

      (deps.state.groupEventQueries
        [groupId][daysStart + 1][queryKey] as QueryResult
      ).invalid = true;
      (deps.state.groupEventQueries
        [groupId][daysStart + 3][queryKey] as QueryResult
      ).invalid = true;

      let [start, end] = bounds({
        interval: "day",
        start: daysStart + 1,
        end: daysStart + 3
      });

      fetchGroupEvents({ groupId, period, query }, deps);
      expectCalledWith(apiSpy, groupId, toAPI(start, end, query));
    });

    it("trims fetch period for FETCH_QUERY_END dispatch", (done) => {
      let e1 = makeEvent({ id: "e1" });
      let e2 = makeEvent({ id: "e2" });
      let deps = getDeps();

      fakeData(deps.state);
      (deps.state.groupEventQueries
        [groupId][daysStart + 1][queryKey] as QueryResult
      ).invalid = true;
      (deps.state.groupEventQueries
        [groupId][daysStart + 3][queryKey] as QueryResult
      ).invalid = true;

      let dfd = stubApi(deps.Svcs, "postForGroupEvents");

      fetchGroupEvents({ groupId, period, query }, deps).then(() => {
        expectCalledWith(deps.dispatch, {
          type: "GROUP_EVENTS_DATA",
          dataType: "FETCH_QUERY_END",
          groupId, query,
          period: {
            interval: "day",
            start: daysStart + 1,
            end: daysStart + 3
          },
          events: [e1, e2]
        });
      }).then(done, done);

      deps.dispatch.reset();
      dfd.resolve({
        "cal-id": { events: [e1, e2] }
      });
    });

    it("enqueues multiple fetch periods based on Conf.maxDaysFetch", () => {
      let deps = getDeps();
      (deps.Conf as any).maxDaysFetch = 5;
      let queue = EventQueues.get(groupId);
      let spy = sandbox.spy(queue, 'enqueue');

      fetchGroupEvents({ groupId, period, query }, deps);

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

  // TODO: Pending new API calls
  //
  // describe("fetchByIds", () => {
  //   // Common vars
  //   const eventIds = ["e1", "e2"];
  //   // const event1 = makeEvent({ id: "e1" });
  //   // const event2 = makeEvent({ id: "e2" });

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
              })
            }
          }
        },
        Svcs: apiSvcFactory()
      };
    }

    // Common vars
    const eventIds = ["e1", "e2"];
    const label1 = testLabel("L1");
    const label2 = testLabel("L2");

    afterEach(() => {
      GroupLabelQueues.reset();
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
        recurringEventIds: [],
        addLabels: [label1],
        rmLabels: [],
        hidden: false
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
        type: "GROUP_EVENTS_UPDATE",
        groupId,
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
        type: "GROUP_EVENTS_UPDATE",
        groupId,
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

      deps.state.groupEvents[groupId].e1.labels_confirmed = true;
      deps.state.groupEvents[groupId].e2.labels_confirmed = false;

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

      deps.state.groupEvents[groupId].e1.labels_confirmed = true;
      deps.state.groupEvents[groupId].e1.hidden = true;
      deps.state.groupEvents[groupId].e2.labels_confirmed = false;
      deps.state.groupEvents[groupId].e2.hidden = true;

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
            groupEvents: {
              [groupId]: {
                ...deps.state.groupEvents[groupId],
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
            groupRecurringEvents: {
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
          type: "GROUP_EVENTS_UPDATE",
          groupId,
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
          type: "GROUP_EVENTS_UPDATE",
          groupId,
          eventIds: ["e4"],
          recurringEventIds: [],
          addLabels: [label1],
          rmLabels: [],
          hidden: false
        });

        dfd.resolve({});
      });
    });
  });

  // Shared helper for stubbing comment API function
  function stubComment(Svcs: ApiSvc) {
    return stubApiRet(Svcs, "postGroupEventComment",
      (groupId: string, eventId: string, commentBody: ApiT.PostComment) => ({
        author: "Hello",
        upvoted_users: [],
        created: (new Date()).toISOString(),
        id: "id-" + commentBody.body,
        text: commentBody.body
      }));
  }

  describe("postGroupEventComment", () => {
    function getDeps() {
      return {
        Svcs: apiSvcFactory(),
        dispatch: sandbox.spy()
      };
    }

    const groupId = "group-id";
    const eventId = "event-id";
    const text = "Comment text";

    it("posts API call for comment", () => {
      let deps = getDeps();
      let stub = stubComment(deps.Svcs);
      postGroupEventComment({ groupId, eventId, text }, deps);
      expectCalledWith(stub, groupId, eventId, { body: text });
    });

    it("does not dispatch until API call returns", (done) => {
      let deps = getDeps();
      stubComment(deps.Svcs);

      postGroupEventComment({ groupId, eventId, text }, deps).then(() => {
        expect(deps.dispatch.called).to.be.true;
      }).then(done, done);

      expect(deps.dispatch.called).to.be.false;
    });
  });

  describe("deleteGroupEventComment", () => {
    function getDeps() {
      return {
        Svcs: apiSvcFactory(),
        dispatch: sandbox.spy()
      };
    }

    const groupId = "group-id";
    const eventId = "event-id";
    const commentId = "comment-id";

    it("dispatches GROUP_EVENT_COMMENT_DELETE action", () => {
      let deps = getDeps();
      deleteGroupEventComment({ groupId, eventId, commentId }, deps);
      expectCalledWith(deps.dispatch, {
        type: "GROUP_EVENT_COMMENT_DELETE",
        groupId, eventId, commentId
      });
    });

    it("posts API call to delete comment", () => {
      let deps = getDeps();
      let spy = sandbox.spy(deps.Svcs.Api, "deleteGroupEventComment");
      deleteGroupEventComment({ groupId, eventId, commentId }, deps);
      expectCalledWith(spy, groupId, commentId);
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
      setLabels: [],
      predictLabels: [],
      deps: deps || getDeps()
    };
  };

  function makeCommentRequest(deps?: Deps) {
    return {
      type: "COMMENT" as "COMMENT",
      eventId: "id",
      text: "Comment text",
      deps: deps || getDeps()
    };
  }

  function makeCommentDeleteRequest(deps?: Deps) {
    return {
      type: "DELETE_COMMENT" as "DELETE_COMMENT",
      commentId: "commentId",
      deps: deps || getDeps()
    };
  }

  function makeQueryRequest(deps?: Deps) {
    return {
      type: "FETCH_QUERY" as "FETCH_QUERY",
      period: { interval: "day" as "day", start: 1000, end: 1014 },
      query: {},
      priority: 123,
      deps: deps || getDeps()
    }
  }

  describe("processQueueRequest", () => {
    it("processes push requests in parallel before fetch requests", (done) => {
      let deps = getDeps();
      let fetch1 = makeQueryRequest(deps);
      let fetch2 = makeQueryRequest(deps);
      let push1 = makeCommentRequest(deps);
      let push2 = makeLabelRequest(deps);
      let push3 = makeCommentDeleteRequest(deps);

      // Stub all API calls to resolve right away
      let labelStub = stubApiRet(deps.Svcs, "setPredictGroupLabels");
      let commentStub = stubComment(deps.Svcs);
      let commentDeleteStub = stubApiRet(deps.Svcs, "deleteGroupEventComment");

      processQueueRequest("group-id", [
        fetch1,
        push1,
        push2,
        push3,
        fetch2
      ]).then((ret) => {
        expect(labelStub.callCount).to.equal(1);
        expect(commentStub.callCount).to.equal(1);
        expect(commentDeleteStub.callCount).to.equal(1);
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
      processLabelRequests("group-id", [{
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
        expectCalledWith(labelStub, "group-id", {
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
      processLabelRequests("group-id", [{
        ...makeLabelRequest(deps),
        setLabels: [{
          id: "e1",
          labels: ["L1"],
          hidden: true
        }]
      }]).then(() => {
        expectCalledWith(labelStub, "group-id", {
          set_labels: [{
            id: "e1",
            hidden: true
          }],
          predict_labels: []
        });
      }).then(done, done);
    });

    it("unsets hidden when settings any labels", (done) => {
      processLabelRequests("group-id", [{
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
        expectCalledWith(labelStub, "group-id", {
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
      processLabelRequests("group-id", [{
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
        expectCalledWith(labelStub, "group-id", {
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

  describe("processCommentRequests", () => {
    var commentStub: Sinon.SinonStub;
    var deps: Deps;

    beforeEach(() => {
      deps = getDeps();
      commentStub = stubComment(deps.Svcs);
    });

    it("processes multiple comments in parallel", (done) => {
      let c1 = {
        ...makeCommentRequest(deps),
        text: "Test 1"
      };
      let c2 = {
        ...makeCommentRequest(deps),
        text: "Test 2"
      };
      processCommentRequests("group-id", [c1, c2]).then(() => {
        expectCalledWith(commentStub, "group-id", c1.eventId, {
          body: c1.text
        });
        expectCalledWith(commentStub, "group-id", c2.eventId, {
          body: c2.text
        });
      }).then(done, done);
    });

    it("dispatches updates for each comment", (done) => {
      let c1 = {
        ...makeCommentRequest(deps),
        text: "Test 1"
      };
      let c2 = {
        ...makeCommentRequest(deps),
        text: "Test 2"
      };
      processCommentRequests("group-id", [c1, c2]).then(() => {
        expectCalledWith(deps.dispatch, {
          type: "GROUP_EVENT_COMMENT_POST",
          commentId: "id-" + c1.text,
          eventId: c1.eventId,
          groupId: "group-id",
          text: c1.text
        });
        expectCalledWith(deps.dispatch, {
          type: "GROUP_EVENT_COMMENT_POST",
          commentId: "id-" + c2.text,
          eventId: c2.eventId,
          groupId: "group-id",
          text: c2.text
        });
      }).then(done, done);
    });
  });

  describe("processDeleteCommentRequests", () => {
    it("processes multiple deletions in parallel", (done) => {
      let deps = getDeps();
      let stub = stubApiRet(deps.Svcs, "deleteGroupEventComment");
      let c1 = {
        ...makeCommentDeleteRequest(deps),
        commentId: "id1"
      };
      let c2 = {
        ...makeCommentDeleteRequest(deps),
        commentId: "id2"
      };
      processDeleteCommentRequest("group-id", [c1, c2]).then(() => {
        expectCalledWith(stub, "group-id", c1.commentId);
        expectCalledWith(stub, "group-id", c2.commentId);
      }).then(done, done);
    });
  });
});