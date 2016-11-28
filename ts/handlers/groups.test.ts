import * as Groups from "./groups";
import * as _ from "lodash";
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

  describe("renameGroup", function() {
    function getDeps() {
      return {
        dispatch: sandbox.spy(),
        state: _.extend(initState(), {
          groupSummaries: { "id-1": makeGroup() }
        }),
        Svcs: apiSvcFactory()
      };
    }

    it("dispatches a GROUP_DATA PUSH action", function() {
      let deps = getDeps();
      Groups.renameGroup("id-1", "New Group Name", deps);
      expectCalledWith(deps.dispatch, {
        type: "GROUP_DATA",
        dataType: "PUSH",
        groups: [_.extend({}, deps.state.groupSummaries["id-1"], {
          group_name: "New Group Name"
        })]
      });
    });

    it("fires an API call to rename group", function() {
      let deps = getDeps();
      let apiSpy = sandbox.spy(deps.Svcs.Api, "renameGroup");
      Groups.renameGroup("id-1", "New Group Name", deps);
      expectCalledWith(apiSpy, "id-1", "New Group Name");
    });

    it("should fire API call but not dispatch if no existing summary in state",
    function() {
      let deps = getDeps();
      let apiSpy = sandbox.spy(deps.Svcs.Api, "renameGroup");
      Groups.renameGroup("id-2", "New Group Name", deps);
      expect(deps.dispatch.called).to.be.false;
      expectCalledWith(apiSpy, "id-2", "New Group Name");
    });
  });

  describe("initData", function() {
    function getDeps() {
      return {
        dispatch: sandbox.spy(),
        Svcs: apiSvcFactory()
      };
    }

    it("should dispatch a FETCH_START for all data in login info", function() {
      let deps = getDeps();
      let info: any = { // Incomplete login info, but OK for testing
        uid: "my-uid",
        groups: ["id-1", "id-2"]
      };
      let apiSpy = sandbox.spy(deps.Svcs.Api, "getGroupsByUid");
      Groups.initData(info, deps);
      expectCalledWith(deps.dispatch, {
        type: "GROUP_DATA",
        dataType: "FETCH_START",
        groupIds: ["id-1", "id-2"]
      });
      expectCalledWith(apiSpy, "my-uid", {});
    });

    it("should dispatch a FETCH_END once API call resolves", function(done) {
      let deps = getDeps();
      let info: any = { // Incomplete login info, but OK for testing
        uid: "my-uid",
        groups: ["id-1", "id-2"]
      };
      let g1 = makeGroup({ groupid: "id-1" });
      let dfd = stubApi(deps.Svcs, "getGroupsByUid");

      Groups.initData(info, deps).then(function() {
        expectCalledWith(deps.dispatch, {
          type: "GROUP_DATA",
          dataType: "FETCH_END",
          groupIds: ["id-1", "id-2"],
          groups: [g1]
        });
      }).then(done, done);

      dfd.resolve({ items: [g1] });
    });
  });
});