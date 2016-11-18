import analyticsFake from "../fakes/analytics-fake";
import apiFake from "../fakes/api-fake";
import { expect } from "chai";
import { expectCalledWith } from "../lib/expect-helpers";
import { sandbox } from "../lib/sandbox";
import * as Routes from "./routes";

describe("Routes", function() {
  function getSvcs() {
    return {
      Analytics: analyticsFake().Analytics,
      Api: apiFake().Api
    };
  }

  describe("eventList", function() {
    it("should return a GroupEvents state", function() {
      let { cb } = Routes.eventList;
      let svcs = getSvcs();
      let s = cb({groupId: "group-id-123"}, {}, svcs);
      expect(s).to.deep.equal({ page: "GroupEvents" });
    });

    it("should call analytics for GroupEvents", function() {
      let { cb } = Routes.eventList;
      let svcs = getSvcs();
      let spy = sandbox.spy(svcs.Analytics, "page");
      cb({groupId: "group-id-123"}, {}, svcs);
      expectCalledWith(spy, ["GroupEvents", {
        groupId: "group-id-123"
      }]);
    });
  });

  describe("setup", function() {
    it("should return an setup state", function() {
      let { cb } = Routes.setup;
      let svcs = getSvcs();
      let s = cb({}, {}, svcs);
      expect(s).to.deep.equal({ page: "Setup" });
    });

    it("should call analytics for Setup", function() {
      let { cb } = Routes.setup;
      let svcs = getSvcs();
      let spy = sandbox.spy(svcs.Analytics, "page");
      cb({}, {}, svcs);
      expectCalledWith(spy, "GroupSetup");
    });
  })
});