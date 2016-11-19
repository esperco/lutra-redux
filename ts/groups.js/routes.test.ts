import analyticsFake from "../fakes/analytics-fake";
import apiFake from "../fakes/api-fake";
import { expectCalledWith } from "../lib/expect-helpers";
import { sandbox } from "../lib/sandbox";
import initState from "./init-state";
import * as Routes from "./routes";

describe("Routes", function() {
  function getSvcs() {
    return {
      Analytics: analyticsFake().Analytics,
      Api: apiFake().Api
    };
  }

  function getDeps() {
    return {
      dispatch: sandbox.spy(),
      state: initState(),
      Svcs: getSvcs(),
    };
  }

  describe("eventList", function() {
    it("should dispatch a GroupEvents state", function() {
      let { cb } = Routes.eventList;
      let deps = getDeps();
      cb({groupId: "group-id-123"}, {}, deps);
      expectCalledWith(deps.dispatch, {
        type: "ROUTE",
        route: { page: "GroupEvents", groupId: "group-id-123" }
      });
    });

    it("should call analytics for GroupEvents", function() {
      let { cb } = Routes.eventList;
      let deps = getDeps();
      let spy = sandbox.spy(deps.Svcs.Analytics, "page");
      cb({groupId: "group-id-123"}, {}, deps);
      expectCalledWith(spy, ["GroupEvents", {
        groupId: "group-id-123"
      }]);
    });
  });

  describe("setup", function() {
    it("should return an setup state", function() {
      let { cb } = Routes.setup;
      let deps = getDeps();
      cb({}, {}, deps);
      expectCalledWith(deps.dispatch, {
        type: "ROUTE",
        route: { page: "Setup" }
      })
    });

    it("should call analytics for Setup", function() {
      let { cb } = Routes.setup;
      let deps = getDeps();
      let spy = sandbox.spy(deps.Svcs.Analytics, "page");
      cb({}, {}, deps);
      expectCalledWith(spy, "GroupSetup");
    });
  })
});