import { expect } from "chai";
import { apiSvcFactory, stubApi, stubApiPlus } from "../fakes/api-fake";
import makePrefs from "../fakes/team-preferences-fake";
import makeLogin from "../fakes/login-fake";
import * as PrefHandlers from "../handlers/team-prefs";
import { expectCalledWith } from "../lib/expect-helpers";
import { sandbox } from "../lib/sandbox";
import { initState } from "../states/team-preferences";

describe("Team preference handlers", () => {
  const teamId = "team-id";

  describe("fetch", () => {
    function getDeps() {
      return {
        dispatch: sandbox.spy(),
        state: initState(),
        Svcs: apiSvcFactory()
      };
    }

    it("calls dispatch with fetch start", () => {
      let deps = getDeps();
      PrefHandlers.fetch(teamId, deps);
      expectCalledWith(deps.dispatch, {
        type: "TEAM_PREFERENCES_DATA",
        dataType: "FETCH_START", teamId
      });
    });

    it("makes API call to fetch prefs for team", () => {
      let deps = getDeps();
      let spy = sandbox.spy(deps.Svcs.Api, "getPreferences");
      PrefHandlers.fetch(teamId, deps);
      expectCalledWith(spy, teamId);
    });

    it("doesn't make API call if prefs already set", () => {
      let deps = getDeps();
      deps.state.teamPreferences[teamId] = makePrefs({});
      let spy = sandbox.spy(deps.Svcs.Api, "getPreferences");
      PrefHandlers.fetch(teamId, deps);
      expect(spy.called).to.be.false;
    });

    it("dispatches data on fetch end", (done) => {
      let deps = getDeps();
      let preferences = makePrefs({});
      let dfd = stubApi(deps.Svcs, "getPreferences");
      PrefHandlers.fetch(teamId, deps).then(() => {
        expectCalledWith(deps.dispatch, {
          type: "TEAM_PREFERENCES_DATA",
          dataType: "FETCH_END", teamId,
          preferences
        });
      }).then(done, done);
      dfd.resolve(preferences);
    });

    it("dispatches error if fetch fails", (done) => {
      let deps = getDeps();
      let dfd = stubApi(deps.Svcs, "getPreferences");
      PrefHandlers.fetch(teamId, deps).then(() => {
        expectCalledWith(deps.dispatch, {
          type: "TEAM_PREFERENCES_DATA",
          dataType: "FETCH_END", teamId
        });
      }).then(done, done);
      dfd.reject(new Error("Whoops"));
    });
  });

  describe("update", () => {
    afterEach(() => {
      PrefHandlers.TeamPrefsQueue.reset();
    });

    const oldPrefs = makePrefs({ event_link: false });
    function getDeps() {
      return {
        dispatch: sandbox.spy(),
        state: {
          ...initState(),
          teamPreferences: { [teamId]: oldPrefs }
        },
        Svcs: apiSvcFactory()
      };
    }

    it("dispatches changes to state", () => {
      let deps = getDeps();
      let update = { event_link: true };
      PrefHandlers.update(teamId, update, deps);
      expectCalledWith(deps.dispatch, {
        type: "TEAM_PREFERENCES_UPDATE",
        teamId,
        preferences: update
      });
    });

    it("makes API call to put new state", () => {
      let deps = getDeps();
      let spy = sandbox.spy(deps.Svcs.Api, "putPreferences");
      let update = { event_link: true };
      PrefHandlers.update(teamId, update, deps);
      expectCalledWith(spy, teamId, { ...oldPrefs, ...update });
    });
  });

  describe("autosetTimebomb", () => {
    afterEach(() => {
      PrefHandlers.TeamPrefsQueue.reset();
    });

    describe("with no prefs", () => {
      function getDeps() {
        return {
          dispatch: sandbox.spy(),
          state: { ...initState(), login: makeLogin({}) },
          Svcs: apiSvcFactory()
        };
      }

      it("sets timebomb to on if undefined", async function() {
        let deps = getDeps();
        let preferences = makePrefs({ tb: undefined });

        let dfd1 = stubApi(deps.Svcs, "getPreferences");
        dfd1.resolve(preferences);

        let { dfd: dfd2, stub } = stubApiPlus(deps.Svcs, "putPreferences");
        dfd2.resolve(undefined);

        let ret = await PrefHandlers.autosetTimebomb(teamId, deps);
        expect(ret).to.deep.equal({ ...preferences,
          tb: true,
          tb_same_domain: true
        });
        expectCalledWith(stub, teamId, {
          ...preferences,
          tb: true,
          tb_same_domain: true
        });
      });

      it("does not timebomb to on if already false", async function() {
        let deps = getDeps();
        let preferences = makePrefs({ tb: false });

        let dfd1 = stubApi(deps.Svcs, "getPreferences");
        dfd1.resolve(preferences);

        let { dfd: dfd2, stub } = stubApiPlus(deps.Svcs, "putPreferences");
        dfd2.resolve(undefined);

        let ret = await PrefHandlers.autosetTimebomb(teamId, deps);
        expect(ret).to.deep.equal(preferences);
        expect(stub.called).to.be.false;
      });
    });

    describe("with existing prefs", () => {
      const oldPrefs = makePrefs({ tb: false });
      function getDeps(prefs: Partial<typeof oldPrefs>) {
        return {
          dispatch: sandbox.spy(),
          state: {
            ...initState(),
            login: makeLogin({}),
            teamPreferences: { [teamId]: { ...oldPrefs, ...prefs } }
          },
          Svcs: apiSvcFactory()
        };
      }

      it("sets timebomb to on if undefined", async function() {
        let deps = getDeps({ tb: undefined });
        let { dfd, stub } = stubApiPlus(deps.Svcs, "putPreferences");
        dfd.resolve(undefined);

        let ret = await PrefHandlers.autosetTimebomb(teamId, deps);
        expect(ret).to.deep.equal({
          ...oldPrefs,
          tb: true,
          tb_same_domain: true
        });
        expectCalledWith(stub, teamId, {
          ...oldPrefs,
          tb: true,
          tb_same_domain: true
        });
      });

      it("does not timebomb to on if already false", async function() {
        let deps = getDeps({ tb: false });
        let { dfd, stub } = stubApiPlus(deps.Svcs, "putPreferences");
        dfd.resolve(undefined);

        let ret = await PrefHandlers.autosetTimebomb(teamId, deps);
        expect(ret).to.deep.equal({ ...oldPrefs, tb: false });
        expect(stub.called).to.be.false;
      });

      it("makes API call to set feature flag if unset", async () => {
        let deps = getDeps({ tb: undefined });
        deps.state.login.feature_flags.tb = false;
        let spy = sandbox.spy(deps.Svcs.Api, "patchFeatureFlags");
        let { dfd } = stubApiPlus(deps.Svcs, "putPreferences");
        dfd.resolve(undefined);
        await PrefHandlers.autosetTimebomb(teamId, deps);
        expectCalledWith(spy, { tb: true });
      });
    });
  });

  describe("autosetFeedback", () => {
    afterEach(() => {
      PrefHandlers.TeamPrefsQueue.reset();
    });

    describe("with no prefs", () => {
      function getDeps() {
        return {
          dispatch: sandbox.spy(),
          state: { ...initState(), login: makeLogin({}) },
          Svcs: apiSvcFactory()
        };
      }

      it("sets feedback to on if undefined", async function() {
        let deps = getDeps();
        let preferences = makePrefs({ fb: undefined });

        let dfd1 = stubApi(deps.Svcs, "getPreferences");
        dfd1.resolve(preferences);

        let { dfd: dfd2, stub } = stubApiPlus(deps.Svcs, "putPreferences");
        dfd2.resolve(undefined);

        let ret = await PrefHandlers.autosetFeedback(teamId, deps);
        expect(ret).to.deep.equal({ ...preferences,
          fb: true,
          fb_same_domain: true
        });
        expectCalledWith(stub, teamId, {
          ...preferences,
          fb: true,
          fb_same_domain: true
        });
      });

      it("does not feedback to on if already false", async function() {
        let deps = getDeps();
        let preferences = makePrefs({ fb: false });

        let dfd1 = stubApi(deps.Svcs, "getPreferences");
        dfd1.resolve(preferences);

        let { dfd: dfd2, stub } = stubApiPlus(deps.Svcs, "putPreferences");
        dfd2.resolve(undefined);

        let ret = await PrefHandlers.autosetFeedback(teamId, deps);
        expect(ret).to.deep.equal(preferences);
        expect(stub.called).to.be.false;
      });
    });

    describe("with existing prefs", () => {
      const oldPrefs = makePrefs({ fb: false });
      function getDeps(prefs: Partial<typeof oldPrefs>) {
        return {
          dispatch: sandbox.spy(),
          state: {
            ...initState(),
            login: makeLogin({}),
            teamPreferences: { [teamId]: { ...oldPrefs, ...prefs } }
          },
          Svcs: apiSvcFactory()
        };
      }

      it("sets feedback to on if undefined", async function() {
        let deps = getDeps({ fb: undefined });
        let { dfd, stub } = stubApiPlus(deps.Svcs, "putPreferences");
        dfd.resolve(undefined);

        let ret = await PrefHandlers.autosetFeedback(teamId, deps);
        expect(ret).to.deep.equal({
          ...oldPrefs,
          fb: true,
          fb_same_domain: true
        });
        expectCalledWith(stub, teamId, {
          ...oldPrefs,
          fb: true,
          fb_same_domain: true
        });
      });

      it("does not set feedback to on if already false", async function() {
        let deps = getDeps({ fb: false });
        let { dfd, stub } = stubApiPlus(deps.Svcs, "putPreferences");
        dfd.resolve(undefined);

        let ret = await PrefHandlers.autosetFeedback(teamId, deps);
        expect(ret).to.deep.equal({ ...oldPrefs, fb: false });
        expect(stub.called).to.be.false;
      });

      it("makes API call to set feature flag if unset", async () => {
        let deps = getDeps({ fb: undefined });
        deps.state.login.feature_flags.fb = false;
        let spy = sandbox.spy(deps.Svcs.Api, "patchFeatureFlags");
        let { dfd } = stubApiPlus(deps.Svcs, "putPreferences");
        dfd.resolve(undefined);
        await PrefHandlers.autosetFeedback(teamId, deps);
        expectCalledWith(spy, { fb: true });
      });
    });
  });
});