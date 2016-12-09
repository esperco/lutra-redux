import analyticsFake from "../fakes/analytics-fake";
import apiFake from "../fakes/api-fake";
import navFake from "../fakes/nav-fake";
import { expect } from "chai";
import { expectCalledWith } from "../lib/expect-helpers";
import { sandbox } from "../lib/sandbox";
import { stubLogs } from "../fakes/stubs";
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
        hash: "#!/event-list/group-id-123?showFilters=1&eventId=abc"
      }, deps);
      expectCalledWith(deps.dispatch, {
        type: "ROUTE",
        route: {
          page: "GroupEvents",
          groupId: "group-id-123",
          showFilters: true,
          eventId: "abc",
          labels: { all: true }
        }
      });
    });

    it("should call fetch for Groups", function() {
      let deps = getDeps();
      let spy = sandbox.spy(Groups, "fetch");
      Routes.eventList({ pathname, hash: "#!/event-list/group-id-123" }, deps);
      expectCalledWith(spy, "group-id-123", { withLabels: true }, deps);
    });

    it("should re-route to first group if bad group id", function() {
      let deps = getDeps();
      let spy = sandbox.spy(Groups, "fetch");
      Routes.eventList({ pathname, hash: "#!/event-list/group-id-456" }, deps);

      // Group 456 doesn't exist, go to 123 instead
      expectCalledWith(spy, "group-id-123", { withLabels: true }, deps);
      expectCalledWith(deps.dispatch, {
        type: "ROUTE",
        route: {
          page: "GroupEvents",
          groupId: "group-id-123",
          labels: { all: true }
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