import * as Groups from "./groups";
import { expect } from "chai";
import { expectCalledWith } from "../lib/expect-helpers";
import { apiSvcFactory, stubApi } from "../fakes/api-fake";
import { makeGroup } from "../fakes/groups-fake";
import { initState } from "../states/groups";
import { sandbox } from "../lib/sandbox";

describe("Groups handlers", function() {
  describe("fetch", function() {
    function getDeps() {
      return {
        dispatch: sandbox.spy(),
        state: initState(),
        Svcs: apiSvcFactory()
      };
    }

    it("should dispatch a GROUP_DATA event to fetch members", function() {
      let deps = getDeps();
      Groups.fetch("id-1", { withMembers: true }, deps);
      expectCalledWith(deps.dispatch, {
        type: "GROUP_DATA",
        dataType: "FETCH_START",
        groupIds: ["id-1"],
        withMembers: true
      });
    });

    it("should make API call to fetch members", function() {
      let deps = getDeps();
      let spy = sandbox.spy(deps.Svcs.Api, "getGroupDetails");
      Groups.fetch("id-1", { withMembers: true }, deps);
      expectCalledWith(spy, "id-1", {
        withMembers: true
      });
    });

    it("should dispatch a GROUP_DATA event to fetch labels", function() {
      let deps = getDeps();
      Groups.fetch("id-1", { withLabels: true }, deps);
      expectCalledWith(deps.dispatch, {
        type: "GROUP_DATA",
        dataType: "FETCH_START",
        groupIds: ["id-1"],
        withLabels: true
      });
    });

    it("should make API call to fetch labels", function() {
      let deps = getDeps();
      let spy = sandbox.spy(deps.Svcs.Api, "getGroupDetails");
      Groups.fetch("id-1", { withLabels: true }, deps);
      expectCalledWith(spy, "id-1", {
        withLabels: true
      });
    });

    it("should not dispatch a GROUP_DATA event if data already OK", function() {
      let deps = getDeps();
      deps.state.groupSummaries = { "id-1": makeGroup({ groupid: "id-1" }) };
      Groups.fetch("id-1", {}, deps);
      expect(deps.dispatch.called).to.be.false;
    });

    it("should dispatch a GROUP_DATA event if data partially OK", function() {
      let deps = getDeps();
      Groups.fetch("id-1", { withLabels: true }, deps);
      deps.state.groupSummaries = { "id-1": makeGroup({ groupid: "id-1" }) };
      expect(deps.dispatch.called).to.be.true;
    });

    describe("on API return", function() {
      it("should dispatch a GROUP_DATA event with FETCH_END",
      function(done) {
        let deps = getDeps();
        let dfd = stubApi(deps.Svcs, "getGroupDetails");
        let g = makeGroup({ groupid: "id-1" });

        Groups.fetch("id-1", { withLabels: true }, deps).then(() => {
          expectCalledWith(deps.dispatch, {
            type: "GROUP_DATA",
            dataType: "FETCH_END",
            groupIds: ["id-1"],
            groups: [g],
            withLabels: true
          });
        }).then(done, done);

        dfd.resolve(g);
      });
    });
  });
});