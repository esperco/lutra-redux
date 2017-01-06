import analyticsFake from "../fakes/analytics-fake";
import apiFake from "../fakes/api-fake";
import navFake from "../fakes/nav-fake";
import { expect } from "chai";
import { expectCalledWith } from "../lib/expect-helpers";
import { sandbox } from "../lib/sandbox";
import { stubLogs } from "../fakes/stubs";
import * as Calcs from "../handlers/group-calcs";
import * as Events from "../handlers/group-events";
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

    it("should fetch a default two week period if none provided " +
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
          period: { interval: 'week', start: 2448, end: 2449 }
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
      let spy = sandbox.spy(Events, "fetchGroupEvents");
      Routes.eventList({ pathname,
        hash: "#!/event-list/group-id-123?period=w,2400,2401&labels=0,1,"
      }, deps);
      expectCalledWith(spy, {
        groupId: "group-id-123",
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

    it("should route to not found if no groups in state", function() {
      let deps = getDeps();
      if (deps.state.login) { deps.state.login.groups = []; }

      let fetchSpy = sandbox.spy(Groups, "fetch");
      let logSpies = stubLogs();
      Routes.eventList({ pathname, hash: "#!/event-list/group-id-456" }, deps);

      // Don't call fetch, go to not found page
      expect(fetchSpy.called).to.be.false;
      expect(logSpies.error.called).to.be.true;
      expectCalledWith(deps.dispatch, {
        type: "ROUTE",
        route: { page: "NotFound" }
      });
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