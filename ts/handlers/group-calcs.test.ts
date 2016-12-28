import { expect } from "chai";
import { startGroupCalc } from "../handlers/group-calcs";
import { expectCalledWith } from "../lib/expect-helpers";
import { sandbox } from "../lib/sandbox";
import { Deferred } from "../lib/util";

describe("Group Calcs handlers", () => {
  describe("startGroupCalc", () => {
    function getDeps() {
      return {
        dispatch: sandbox.spy(),
        postTask: sandbox.spy()
      };
    }

    const groupId = "my-group-id";
    const period = { interval: "week" as "week", start: 123, end: 124 };
    const query = { contains: "Test" };

    it("dispatches a GROUP_CALC_START action", () => {
      let deps = getDeps();
      startGroupCalc({ groupId, period, query }, deps);
      expectCalledWith(deps.dispatch, {
        type: "GROUP_CALC_START",
        groupId, period, query
      });
    });

    it("posts a GROUP_QUERY_CALC task to our worker", () => {
      let deps = getDeps();
      startGroupCalc({ groupId, period, query }, deps);
      expectCalledWith(deps.postTask, {
        type: "GROUP_QUERY_CALC",
        groupId, period, query
      });
    });

    it("waits on a promise if passed one before starting calc", (done) => {
      let dfd = new Deferred<void>();
      let deps = { ...getDeps(), promise: dfd.promise() };
      startGroupCalc({ groupId, period, query }, deps).then(() => {
        expect(deps.postTask.called).to.be.true;
      }).then(done, done);

      expect(deps.postTask.called).to.be.false;
      dfd.resolve();
    });
  });
});