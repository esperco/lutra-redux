import { expect } from "chai";
import { expectCalledWith } from "./expect-helpers";
import sandbox from "./sandbox";
import { apiSvcFactory, stubApi } from "../fakes/api-fake";
import analyticsFake from "../fakes/analytics-fake";
import localStoreFake from "../fakes/local-store-fake";
import navFake from "../fakes/nav-fake";
import { AjaxError } from "./json-http";
import * as Login  from "./login";
import * as Sinon from 'sinon';

describe("Login", function() {
  describe("init", function() {
    const Conf = { loginRedirect: "//something/login" };

    // Default helper for getting all of the services Login needs
    function getSvcs(initData?: any) {
      initData = initData || {
        login: {
          uid: "O-w_lois_____________w",
          api_secret: "lois_secret",
          email: "lois@esper.com",
          as_admin: false
        }
      };

      let { Analytics } = analyticsFake();
      let { Api } = apiSvcFactory();
      let { LocalStore } = localStoreFake(initData);
      let { Nav } = navFake();
      return {
        Analytics, Api, LocalStore, Nav
      };
    }

    it("gets credentials from local store", function() {
      let dispatch = Sinon.spy();
      let Svcs = getSvcs();
      let spy = sandbox.spy(Svcs.Api, "getLoginInfoWithRetry");

      Login.init(dispatch, Conf, Svcs);

      expectCalledWith(spy);
      expect(dispatch.called).to.be.false;
    });

    it("sets API login", function() {
      let dispatch = Sinon.spy();
      let Svcs = getSvcs();
      let spy = sandbox.spy(Svcs.Api, "setLogin");

      Login.init(dispatch, Conf, Svcs);

      expectCalledWith(spy, {
        uid: "O-w_lois_____________w",
        apiSecret: "lois_secret"
      });
    });

    it("should not dispatch until ready", function() {
      let dispatch = Sinon.spy();
      let Svcs = getSvcs();

      Login.init(dispatch, Conf, Svcs);

      expect(dispatch.called).to.be.false;
    });

    it("handles missing credentials gracefully", function() {
      let dispatch = Sinon.spy();
      let Svcs = getSvcs({});
      let spy1 = sandbox.spy(Svcs.Api, "getLoginInfoWithRetry");
      let spy2 = sandbox.spy(Svcs.Api, "setLogin")
      let spy3 = sandbox.spy(Svcs.Nav, "go");

      Login.init(dispatch, Conf, Svcs);

      expect(spy1.called).to.be.false;
      expect(spy2.called).to.be.false;
      expectCalledWith(spy3, Conf.loginRedirect);
      expect(dispatch.called).to.be.false;
    });

    it("dispatches login info", function(done) {
      let dispatch = Sinon.spy();
      let Svcs = getSvcs();
      let dfd = stubApi(Svcs, "getLoginInfoWithRetry");

      // Type doesn't matter here
      let fakeData: any = { x: 1, y: 2 };

      Login.init(dispatch, Conf, Svcs).then((x) => {
        expect(x).to.deep.equal(fakeData);
        expectCalledWith(dispatch, {
          type: "LOGIN",
          info: fakeData,
          asAdmin: false
        });
      }).then(done, done);

      dfd.resolve(fakeData);
    });

    it("calls analytics.identify if user is not logged in as admin",
    function(done) {
      let dispatch = Sinon.spy();
      let Svcs = getSvcs();
      let dfd = stubApi(Svcs, "getLoginInfoWithRetry");
      let spy = sandbox.spy(Svcs.Analytics, "identify");

      // Type doesn't matter here
      let fakeData: any = { x: 1, y: 2 };

      Login.init(dispatch, Conf, Svcs).then((x) => {
        expectCalledWith(spy, fakeData);
        expect(Svcs.Analytics.disabled).to.be.false;
      }).then(done, done);

      dfd.resolve(fakeData);
    });

    it("disables analytics if user is logged in as admin",
    function(done) {
      let dispatch = Sinon.spy();
      let Svcs = getSvcs({
        login: {
          uid: "O-w_lois_____________w",
          api_secret: "lois_secret",
          email: "lois@esper.com",
          as_admin: true
        }
      });
      let dfd = stubApi(Svcs, "getLoginInfoWithRetry");
      let spy = sandbox.spy(Svcs.Analytics, "identify");

      // Type doesn't matter here
      let fakeData: any = { x: 1, y: 2 };

      Login.init(dispatch, Conf, Svcs).then((x) => {
        expect(Svcs.Analytics.disabled).to.be.true;
        expect(spy.called).to.be.false;
      }).then(done, done);

      dfd.resolve(fakeData);
    });

    it("handles invalid logins gracefully", function(done) {
      let dispatch = Sinon.spy();
      let Svcs = getSvcs();
      let dfd = stubApi(Svcs, "getLoginInfoWithRetry");
      let spy = sandbox.spy(Svcs.Nav, "go");

      Login.init(dispatch, Conf, Svcs).then(() => {
        throw new Error("Should not be successful");
      }, (err) => {
        expectCalledWith(spy, Conf.loginRedirect);
      }).then(done, done);

      // Reject with invalid auth headers
      dfd.reject(new AjaxError({
        method: "GET",
        url: "/api/login/uid/info",
        reqBody: "",
        code: 401,
        respBody: "Blergh!"
      }));
    });
  });

  describe("loginReducer", function() {
    it("should update login and asAdmin without mutation info", function() {
      let info: any = { type: "doesn't matter here", really: true };
      let s1: Login.LoginState = { };
      let s2 = Login.loginReducer(s1, { type: "LOGIN", info, asAdmin: true });
      expect(s1.loggedInAsAdmin).to.be.undefined;
      expect(s1.login).to.be.undefined;
      expect(s2.loggedInAsAdmin).to.be.true;
      expect(s2.login).to.deep.equal(info);
    });
  });
});
