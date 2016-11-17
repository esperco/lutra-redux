import { expect } from "chai";
import { expectCalledWith } from "./expect-helpers";
import sandbox from "./sandbox";
import { apiSvcFactory, stubApi } from "../fakes/api-fake";
import localStoreFake from "../fakes/local-store-fake"; 
import navFake from "../fakes/nav-fake";
import { AjaxError } from "./json-http";
import * as Login  from "./login";
import * as Sinon from 'sinon';

describe("Login", function() {
  describe("init", function() {
    function getLocalStoreSvc() {
      return localStoreFake({
        login: {
          uid: "O-w_lois_____________w",
          api_secret: "lois_secret",
          email: "lois@esper.com",
          as_admin: true
        }
      });
    }
    const Conf = { loginRedirect: "//something/login" };

    it("gets credentials from local store", function() {
      let dispatch = Sinon.spy();
      let { Api } = apiSvcFactory(); 
      let spy = sandbox.spy(Api, "getLoginInfo");

      Login.init(dispatch, Conf, {
        Api,
        LocalStore: getLocalStoreSvc().LocalStore,
        Nav: navFake().Nav
      });

      expectCalledWith(spy);
      expect(dispatch.called).to.be.false;
    });

    it("sets API login", function() {
      let dispatch = Sinon.spy();
      let { Api } = apiSvcFactory(); 
      let spy = sandbox.spy(Api, "setLogin");

      Login.init(dispatch, Conf, {
        Api,
        LocalStore: getLocalStoreSvc().LocalStore,
        Nav: navFake().Nav
      });

      expectCalledWith(spy, {
        uid: "O-w_lois_____________w",
        apiSecret: "lois_secret"
      });
    });

    it("should not dispatch until ready", function() {
      let dispatch = Sinon.spy();
      let { Api } = apiSvcFactory(); 

      Login.init(dispatch, Conf, {
        Api,
        LocalStore: getLocalStoreSvc().LocalStore,
        Nav: navFake().Nav
      });

      expect(dispatch.called).to.be.false;
    });

    it("handles missing credentials gracefully", function() {
      let dispatch = Sinon.spy();
      let { Api } = apiSvcFactory(); 
      let { Nav } = navFake();
      let spy1 = sandbox.spy(Api, "getLoginInfo");
      let spy2 = sandbox.spy(Api, "setLogin")
      let spy3 = sandbox.spy(Nav, "go");

      Login.init(dispatch, Conf, {
        Api,
        LocalStore: localStoreFake({}).LocalStore,
        Nav
      });

      expect(spy1.called).to.be.false;
      expect(spy2.called).to.be.false;
      expectCalledWith(spy3, Conf.loginRedirect);
      expect(dispatch.called).to.be.false;
    });

    it("dispatches login info", function(done) {
      let dispatch = Sinon.spy();
      let apiSvc = apiSvcFactory(); 
      let dfd = stubApi(apiSvc, "getLoginInfo");

      // Type doesn't matter here
      let fakeData: any = { x: 1, y: 2 };

      Login.init(dispatch, Conf, {
        Api: apiSvc.Api,
        LocalStore: getLocalStoreSvc().LocalStore,
        Nav: navFake().Nav
      }).then((x) => {
        expect(x).to.deep.equal(fakeData);
        expectCalledWith(dispatch, {
          type: "LOGIN",
          info: fakeData,
          asAdmin: true
        });
      }).then(done, done);

      dfd.resolve(fakeData);
    });

    it("adjusts offset using clock value from server if headers are invalid", 
    function(done) {
      let dispatch = Sinon.spy();
      let apiSvc = apiSvcFactory();
      let setOffset = sandbox.spy(apiSvc.Api, "setOffset");
      let dfd1 = stubApi(apiSvc, "getLoginInfo");
      let dfd2 = stubApi(apiSvc, "clock");

      // Type doesn't matter here
      let fakeData: any = { x: 1, y: 2 };

      Login.init(dispatch, Conf, {
        Api: apiSvc.Api,
        LocalStore: getLocalStoreSvc().LocalStore,
        Nav: navFake().Nav
      }).then((x) => {
        expect(x).to.deep.equal(fakeData);
        expectCalledWith(dispatch, {
          type: "LOGIN",
          info: fakeData,
          asAdmin: true
        });
        expect(setOffset.called).to.be.true;
      }).then(done, done);

      // Reject with invalid auth headers
      dfd1.reject(new AjaxError({
        method: "GET",
        url: "/api/login/uid/info",
        reqBody: "",
        code: 401,
        respBody: JSON.stringify({
          http_status_code: 401,
          error_message: "Doesn't matter",
          error_details: "Invalid_authentication_headers"
        })
      }));
      let dfd3 = stubApi(apiSvc, "getLoginInfo");

      // Resolve clock
      dfd2.resolve({ timestamp: "2016-11-01T00:00:00.000-08:00" });

      // Resolve second dfd
      dfd3.resolve(fakeData);
    });

    it("handles invalid logins gracefully", function(done) {
      let dispatch = Sinon.spy();
      let apiSvc = apiSvcFactory();
      let dfd = stubApi(apiSvc, "getLoginInfo");
      let { Nav } = navFake();
      let spy = sandbox.spy(Nav, "go");

      Login.init(dispatch, Conf, {
        Api: apiSvc.Api,
        LocalStore: getLocalStoreSvc().LocalStore,
        Nav
      }).then(() => {
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
