import * as Groups from "./groups";
import { expect } from "chai";
import { expectCalledWith } from "../lib/expect-helpers";
import { apiSvcFactory, stubApi, stubApiPlus } from "../fakes/api-fake";
import { makeGroup } from "../fakes/groups-fake";
import { testLabel } from "../fakes/labels-fake";
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
    afterEach(() => {
      Groups.RenameQueue.reset();
    });

    function getDeps() {
      return {
        dispatch: sandbox.spy(),
        state: initState(),
        Svcs: apiSvcFactory()
      };
    }

    it("dispatches a GROUP_UPDATE action", function() {
      let deps = getDeps();
      Groups.renameGroup("id-1", "New Group Name", deps);
      expectCalledWith(deps.dispatch, {
        type: "GROUP_UPDATE",
        groupId: "id-1",
        summary: { group_name: "New Group Name" }
      });
    });

    it("fires an API call to rename group", function() {
      let deps = getDeps();
      let apiSpy = sandbox.spy(deps.Svcs.Api, "renameGroup");
      Groups.renameGroup("id-1", "New Group Name", deps);
      expectCalledWith(apiSpy, "id-1", "New Group Name");
    });
  });

  describe("setGroupLabels", function() {
    afterEach(() => {
      Groups.LabelQueues.reset();
    });

    const label1 = testLabel("L1");
    const label2 = testLabel("L2");

    function getDeps() {
      return {
        dispatch: sandbox.spy(),
        state: {
          ...initState(),
          groupLabels: {
            "id-1": { group_labels: [label1] }
          }
        },
        Svcs: apiSvcFactory()
      };
    }

    it("dispatches a GROUP_UPDATE action", function() {
      let deps = getDeps();
      Groups.setGroupLabels({
        groupId: "id-1",
        addLabels: [label2],
        rmLabels: [label1]
      }, deps);
      expectCalledWith(deps.dispatch, {
        type: "GROUP_UPDATE",
        groupId: "id-1",
        labels: { group_labels: [label2] }
      });
    });

    it("fires an API call to set labels", () => {
      let deps = getDeps();
      let apiSpy = sandbox.spy(deps.Svcs.Api, "putGroupLabels");
      Groups.setGroupLabels({
        groupId: "id-1",
        addLabels: [label2],
        rmLabels: [label1]
      }, deps);
      expectCalledWith(apiSpy, "id-1", {
        labels: [label2.original]
      });
    });

    it("fires an API call to set colors on new labels only", (done) => {
      let deps = getDeps();
      let { dfd: dfd1 } = stubApiPlus(deps.Svcs, "putGroupLabels");
      let { dfd: dfd2, stub } = stubApiPlus(deps.Svcs, "setGroupLabelColor");
      Groups.setGroupLabels({
        groupId: "id-1",
        addLabels: [label2]
      }, deps).then(() => {
        expect(stub.callCount).to.equal(1);
        expectCalledWith(stub, "id-1", {
          label: label2.original,
          color: label2.color
        });
      }).then(done, done);
      dfd1.resolve({});
      dfd2.resolve({});
    });

    it("does not fire any API calls if labels are identical", (done) => {
      let deps = getDeps();
      let { dfd: dfd1, stub: stub1 } = stubApiPlus(
        deps.Svcs, "putGroupLabels");
      let { dfd: dfd2, stub: stub2 } = stubApiPlus(
        deps.Svcs, "setGroupLabelColor");
      Groups.setGroupLabels({
        groupId: "id-1",
        addLabels: [label1]
      }, deps).then(() => {
        expect(stub1.called).to.be.false;
        expect(stub2.called).to.be.false;
      }).then(done, done);
      dfd1.resolve({});
      dfd2.resolve({});
    });

    it("does fire an API call if label is changed", (done) => {
      let deps = getDeps();
      let { dfd: dfd1, stub: stub1 } = stubApiPlus(
        deps.Svcs, "putGroupLabels");
      let { dfd: dfd2, stub: stub2 } = stubApiPlus(
        deps.Svcs, "setGroupLabelColor");
      Groups.setGroupLabels({
        groupId: "id-1",
        addLabels: [{
          ...label1,
          original: label1.original + "!",
          color: "#000"
        }]
      }, deps).then(() => {
        expect(stub1.called).to.be.true;
        expect(stub2.called).to.be.true;
      }).then(done, done);
      dfd1.resolve({});
      dfd2.resolve({});
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