import { expect } from "chai";
import apiFake from "../fakes/api-fake";
import makeLogin from "../fakes/login-fake";
import { expectCalledWith } from "../lib/expect-helpers";
import { sandbox } from "../lib/sandbox";
import { ensureFlags } from "./feature-flags";

describe("ensureFlags", () => {
  function getDeps() {
    let deps = {
      dispatch: sandbox.spy(),
      state: { login: makeLogin({}), loggedInAsAdmin: false },
      Svcs: apiFake()
    };
    return deps;
  }

  it("posts patch if change required", () => {
    let deps = getDeps();
    let spy = sandbox.spy(deps.Svcs.Api, "patchFeatureFlags");
    deps.state.login.feature_flags.tb = false;
    ensureFlags({ tb: true }, deps);
    expectCalledWith(spy, { tb: true });
  });

  it("doesn't post API call if change not required", () => {
    let deps = getDeps();
    let spy = sandbox.spy(deps.Svcs.Api, "patchFeatureFlags");
    deps.state.login.feature_flags.tb = true;
    ensureFlags({ tb: true }, deps);
    expect(spy.called).to.be.false;
  });

  it("doesn't post API call if logged in as admin", () => {
    let deps = getDeps();
    let spy = sandbox.spy(deps.Svcs.Api, "patchFeatureFlags");
    deps.state.login.feature_flags.tb = false;
    deps.state.loggedInAsAdmin = true;
    ensureFlags({ tb: true }, deps);
    expect(spy.called).to.be.false;
  });

  it("performs optimistic update dispatch", () => {
    let deps = getDeps();
    deps.state.login.feature_flags.tb = false;
    ensureFlags({ tb: true }, deps);
    expectCalledWith(deps.dispatch, {
      type: "FEATURE_FLAG",
      flags: { tb: true }
    });
  });
});