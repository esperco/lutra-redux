import analyticsFake from "../fakes/analytics-fake";
import apiFake from "../fakes/api-fake";
import makeEvent from "../fakes/events-fake";
import navFake from "../fakes/nav-fake";
import { expect } from "chai";
import { expectCalledWith } from "../lib/expect-helpers";
import { stringify } from "../lib/event-queries";
import { sandbox } from "../lib/sandbox";
import * as Calcs from "../handlers/group-calcs";
import * as Events from "../handlers/events";
import * as Groups from "../handlers/groups";
import initState from "./init-state";
import * as Routes from "./routes";

describe("Routes", function() {
  function getSvcs() {
    return {
      Analytics: analyticsFake().Analytics,
      Api: apiFake().Api,
      Nav: navFake().Nav
    };
  }

  function getDeps() {
    let ret = {
      dispatch: sandbox.spy(),
      state: initState(),
      Svcs: getSvcs(),
      postTask: sandbox.spy(),
      Conf: {}
    };

    // Incomplete login response -- but good enough for tests
    let loginResponse: any = {
      groups: ["group-id-123"]
    };
    ret.state.login = loginResponse;

    return ret;
  }

  let pathname = "/groups";
  describe("eventList", function() {
    it("should dispatch a GroupEvents state", function() {
      let deps = getDeps();
      Routes.eventList({
        pathname,
        hash: "#!/event-list/group-id-123?" +
              "showFilters=1&eventId=abc&period=w,2400,2401"
      }, deps);
      expectCalledWith(deps.dispatch, {
        type: "ROUTE",
        route: {
          page: "GroupEvents",
          groupId: "group-id-123",
          showFilters: true,
          eventId: "abc",
          query: {},
          period: { interval: 'week', start: 2400, end: 2401 }
        }
      });
    });

    it("should fetch a default 7-day period starting today if none provided " +
       "and use all labels", () => {
      sandbox.useFakeTimers(1480579200000); // 12/1/2016
      let deps = getDeps();
      Routes.eventList({
        pathname,
        hash: "#!/event-list/group-id-123?showFilters=1&eventId=abc"
      }, deps);
      expectCalledWith(deps.dispatch, {
        type: "ROUTE",
        route: {
          page: "GroupEvents",
          groupId: "group-id-123",
          showFilters: true,
          eventId: "abc",
          query: {},
          period: { interval: 'day', start: 17136, end: 17142 }
        }
      });
    });

    it("should call fetch for Groups", function() {
      let deps = getDeps();
      let spy = sandbox.spy(Groups, "fetch");
      Routes.eventList({ pathname, hash: "#!/event-list/group-id-123" }, deps);
      expectCalledWith(spy, "group-id-123",
        { withLabels: true, withMembers: true }, deps);
    });

    it("should call fetch with query vals", function() {
      let deps = getDeps();
      let spy = sandbox.spy(Events, "fetchEvents");
      Routes.eventList({ pathname,
        hash: "#!/event-list/group-id-123?period=w,2400,2401&labels=0,1,"
      }, deps);
      expectCalledWith(spy, {
        calgroupId: "group-id-123",
        calgroupType: "group",
        period: { interval: "week", start: 2400, end: 2401 },
        query: { labels: { none: true }}
      }, deps);
    });

    it("should start a calc task", function() {
      let deps = getDeps();
      let spy = sandbox.spy(Calcs, "startGroupCalc");
      Routes.eventList({ pathname,
        hash: "#!/event-list/group-id-123?period=w,2400,2401&labels=0,1,"
      }, deps);
      expect(spy.getCall(0).args[0]).to.deep.equal({
        groupId: "group-id-123",
        period: { interval: "week", start: 2400, end: 2401 },
        query: { labels: { none: true }}
      });
    });

    it("should fetch single event before fetching query", () => {
      let deps = getDeps();
      let calls: string[] = [];
      sandbox.stub(Events, "fetchById").callsFake(() => {
        calls.push("getGroupEvent");
        return new Promise(() => {});
      });
      sandbox.stub(Events, "fetchEvents").callsFake(() => {
        calls.push("postForGroupEvents");
        return new Promise(() => {});
      });
      Routes.eventList({
        pathname,
        hash: "#!/event-list/group-id-123?" +
              "showFilters=1&eventId=abc&period=w,2400,2401"
      }, deps);
      expect(calls).to.deep.equal(["getGroupEvent", "postForGroupEvents"]);
    });

    it("should dispatch action to select a single event ID", () => {
      let deps = getDeps();
      Routes.eventList({
        pathname,
        hash: "#!/event-list/group-id-123?" +
              "showFilters=1&eventId=abc&period=w,2400,2401"
      }, deps);
      expectCalledWith(deps.dispatch, {
        type: "TOGGLE_EVENT_SELECTION",
        calgroupId: "group-id-123",
        clear: true,
        eventIds: { abc: true }
      });
    });

    function getDepsForSelectAll() {
      let deps = getDeps();
      deps.state.eventQueries["group-id-123"] = [];
      let queryDays = deps.state.eventQueries["group-id-123"];
      queryDays[10000] = {
        [stringify({})]: {
          query: {},
          eventIds: ["id1", "id2"],
          updatedOn: new Date()
        }
      };
      queryDays[10001] = {
        [stringify({})]: {
          query: {},
          eventIds: ["id2", "id3"],
          updatedOn: new Date()
        }
      };

      deps.state.events["group-id-123"] = {
        id1: makeEvent({ id: "id1" }),
        id2: makeEvent({ id: "id2" }),
        id3: makeEvent({ id: "id3" }),
        id4: makeEvent({ id: "id4" })
      };

      return deps;
    }

    it("should dispatch action to select all", () => {
      let deps = getDepsForSelectAll();
      Routes.eventList({
        pathname,
        hash: "#!/event-list/group-id-123?selectMode=1&period=d,10000,10002"
      }, deps);
      expectCalledWith(deps.dispatch, {
        type: "TOGGLE_EVENT_SELECTION",
        calgroupId: "group-id-123",
        clear: true,
        eventIds: { id1: true, id2: true, id3: true }
      });
    });

    it("should dispatch action to toggle selection on", () => {
      let deps = getDepsForSelectAll();
      Routes.eventList({
        pathname,
        hash: "#!/event-list/group-id-123?eventId=id4&selectMode=1"
      }, deps);
      expectCalledWith(deps.dispatch, {
        type: "TOGGLE_EVENT_SELECTION",
        calgroupId: "group-id-123",
        eventIds: { id4: true }
      });
    });

    it("should dispatch action to toggle selection off", () => {
      let deps = getDepsForSelectAll();
      Routes.eventList({
        pathname,
        hash: "#!/event-list/group-id-123?eventId=id4&selectMode=0"
      }, deps);
      expectCalledWith(deps.dispatch, {
        type: "TOGGLE_EVENT_SELECTION",
        calgroupId: "group-id-123",
        eventIds: { id4: false }
      });
    });

    it("should dispatch action to clear all", () => {
      let deps = getDepsForSelectAll();
      Routes.eventList({
        pathname,
        hash: "#!/event-list/group-id-123"
      }, deps);
      expectCalledWith(deps.dispatch, {
        type: "TOGGLE_EVENT_SELECTION",
        calgroupId: "group-id-123",
        clear: true,
        eventIds: {}
      });
    });

    it("should re-route to first group if bad group id", function() {
      let deps = getDeps();
      let spy = sandbox.spy(Groups, "fetch");
      Routes.eventList({ pathname,
        hash: "#!/event-list/group-id-456?period=w,2400,2401"
      }, deps);

      // Group 456 doesn't exist, go to 123 instead
      expectCalledWith(spy, "group-id-123",
        { withLabels: true, withMembers: true }, deps);
      expectCalledWith(deps.dispatch, {
        type: "ROUTE",
        route: {
          page: "GroupEvents",
          groupId: "group-id-123",
          period: { interval: "week", start: 2400, end: 2401 },
          query: {}
        }
      });
    });

    it("should redirect to setup page if no group", function() {
      let deps = getDeps();
      if (deps.state.login) { deps.state.login.groups = []; }

      let navSpy = sandbox.spy(deps.Svcs.Nav, "go");
      let fetchSpy = sandbox.spy(Groups, "fetch");
      Routes.eventList({ pathname, hash: "#!/event-list/group-id-456" }, deps);

      // Don't call fetch, go to not found page
      expect(fetchSpy.called).to.be.false;
      expectCalledWith(navSpy, "/groups#!/setup");
    });
  });

  describe("setup", function() {
    it("should return an setup state", function() {
      let deps = getDeps();
      Routes.setup({ pathname, hash: "#!/setup" }, deps);
      expectCalledWith(deps.dispatch, {
        type: "ROUTE",
        route: { page: "Setup" }
      })
    });
  })
});