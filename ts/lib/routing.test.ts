import * as _ from "lodash";
import { expect } from "chai";
import {
  Path, init, Nav,
  StringParam, NumberParam, BooleanParam,
  StringArrayParam, NumberArrayParam
} from "./routing";
import analyticsFake from "../fakes/analytics-fake";
import { expectCalledWith } from "./expect-helpers";
import * as Sinon from "sinon";
import { stub as stubGlobal } from "./sandbox";

describe("Routing", function() {
  describe("Path", function() {
    let path = new Path({
      base: "/b",
      params: {
        bool: BooleanParam,
        intArray: NumberArrayParam,
        int: NumberParam,
      },
      optParams: {
        strArray: StringArrayParam
      },
      hash: ["path", ":bool", ":intArray"]
    });

    describe("href", function() {
      it("converts different types to strings", function() {
        expect(path.href({
          bool: true,
          intArray: [1, 2],
          int: 123,
          strArray: ["x=1", "y=2"]
        })).to.equal("/b#!/path/1/1,2?int=123&strArray=x%3D1,y%3D2");
      });
    });

    describe("test", function() {
      it("returns matching params and converts types", function() {
        expect(path.test({
          pathname: "/b",
          hash: "#!/path/0/1,2?int=123&strArray=x%3D1,y%3D2"
        })).to.deep.equal({
          bool: false,
          intArray: [1, 2],
          int: 123,
          strArray: ["x=1", "y=2"]
        });
      });

      it("returns null if base does not match", function() {
        expect(path.test({
          pathname: "/c",
          hash: "#!/path/0/1,2?int=123&strArray=x%3D1,y%3D2"
        })).to.be.null;
      });

      it("returns null if required params are missing", function() {
        expect(path.test({
          pathname: "/b",
          hash: "#!/path/0?int=123&strArray=x%3D1,y%3D2&intArray=1,2"
        })).to.be.null;
      });

      it("doesn't return null if only optParams are missing", function() {
        expect(path.test({
          pathname: "/b",
          hash: "#!/path/0/1,2?int=123"
        })).to.deep.equal({
          bool: false,
          intArray: [1, 2],
          int: 123
        });
      });
    });

    describe("route function", function() {
      let path = new Path({
        base: "/b",
        params: {
          first: StringParam, second: StringParam
        },
        hash: ["path", ":first", ":second"]
      });
      let spy = Sinon.spy();
      let pathFn = path.route(spy)

      beforeEach(function() {
        spy.reset();
      });

      it("executes callback with deps if match", function() {
        pathFn({
          pathname: "/b", hash: "#!/path/first/second"
        }, {
          dog: "woof"
        });

        expectCalledWith(spy, {
          first: "first", second: "second"
        }, {
          dog: "woof"
        });
      });

      it("returns params if match", function() {
        expect(pathFn({
          pathname: "/b", hash: "#!/path/first/second"
        }, {})).to.deep.equal({
          first: "first", second: "second"
        })
      });

      it("doesn't execute callback if no match", function() {
        pathFn({ pathname: "/b", hash: "#" }, {});
        expect(spy.called).to.be.false;
      });

      it("returns null if no match", function() {
        expect(pathFn({ pathname: "/b", hash: "#" }, {})).to.be.null;
      });
    });

    describe("init", function() {
      var addEventListenerStub: Sinon.SinonStub;

      function onHashChange() {
        if (addEventListenerStub) {
          let hashChangeArgs = _.find(addEventListenerStub.args,
            ([name]) => name === "hashchange"
          );
          if (hashChangeArgs) {
            return hashChangeArgs[1]();
          }
          throw new Error(
            "No hash change function in " +
            JSON.stringify(addEventListenerStub.args)
          );
        }
        throw new Error("window.addEventListener not stubbed");
      }

      function getDeps() {
        return {
          dispatch: Sinon.spy(),
          state: {},
          Svcs: _.extend({ Nav }, analyticsFake())
        };
      }

      beforeEach(function() {
        stubGlobal("location", {
          pathname: "/b",
          hash: "",
          href: ""
        });
        addEventListenerStub = stubGlobal(
          ["window", "addEventListener"],
          Sinon.spy()
        );
        Nav.reset();
      });

      it("adds hashchange event listener", function() {
        init([], getDeps);
        expect(onHashChange).to.not.throw();
      });

      it("matches first matching route on hash change", function() {
        let deps = getDeps();

        let path1 = new Path({
          base: "/b",
          params: { arg: StringParam },
          hash: ["noMatch", ":arg"]
        });
        let spy1 = Sinon.spy();
        let route1 = path1.route(spy1);

        let path2 = new Path({
          base: "/b",
          params: { arg: StringParam },
          hash: ["match", ":arg"]
        });
        let spy2 = Sinon.spy();
        let route2 = path2.route(spy2);

        let path3 = new Path({
          base: "/b",
          params: { arg: StringParam },
          hash: ["match", ":arg"]
        });
        let spy3 = Sinon.spy();
        let route3 = path3.route(spy3);

        init([route1, route2, route3], () => deps);

        location.hash = "#!/match/123";
        onHashChange();
        expect(spy1.called).to.be.false;
        expect(spy3.called).to.be.false;
        expectCalledWith(spy2, { arg: "123" }, deps);
      });

      it("dispatches NotFound if no applicable route", function() {
        let deps = getDeps();
        let path = new Path({
          base: "/b",
          params: { arg: StringParam },
          hash: ["noMatch", ":arg"]
        });
        let route = path.route(function() {});

        init([route], () => deps);

        deps.dispatch.reset(); // Init may dispatch something
        location.hash = "#!/gibberish/123";
        onHashChange();

        expectCalledWith(deps.dispatch, {
          type: "ROUTE",
          route: { page: "NotFound" }
        });
      });

      describe("with a home path", function() {
        var homePath = "/b#!/home/path";
        beforeEach(function() {
          init([], getDeps, {
            home: () => homePath
          });
        });

        it("should go home if hash is blank", function() {
          location.hash = "";
          onHashChange();
          expect(location.hash).to.equal(homePath.split("#")[1]);
        });

        it("should go home if hash is just root path", function() {
          location.hash = "#!/";
          onHashChange();
          expect(location.hash).to.equal(homePath.split("#")[1]);
        });
      });

      it("does an inital route on init", function() {
        let deps = getDeps();
        let path = new Path({
          base: "/b",
          params: { arg: StringParam },
          hash: ["match", ":arg"]
        });
        let spy = Sinon.spy();
        let route = path.route(spy);

        location.pathname = "/b";
        location.hash = "#!/match/abc";
        init([route], () => deps);
        expectCalledWith(spy, { arg: "abc" }, deps);
      });

      it("replays long querystrings created with Nav.go", function() {
        let deps = getDeps();
        let path = new Path({
          base: "/b",
          params: { arg: StringParam },
          hash: ["path"]
        });
        let spy = Sinon.spy();
        let route = path.route(spy);
        init([route], () => deps);

        let longStr = _.repeat("n", 2000);
        deps.Svcs.Nav.go("/b#!path?arg=" + longStr);

        // Check that Nav.go hashed query
        expect(location.hash.length).to.be.lt(100);
        expect(deps.Svcs.Nav.queryHashes).is.not.empty;

        onHashChange();
        expect(spy.called).to.be.true;
        expect(spy.args[0][0]).deep.equals({
          arg: longStr
        });
      });

      it("calls page function in analytics service", function() {
        let deps = getDeps();
        let path = new Path({
          base: "/b",
          params: { arg: StringParam },
          hash: ["match", ":arg"]
        });
        let route = path.route(() => null);

        init([route], () => deps);

        location.pathname = "/b";
        location.hash = "#!/match/abc";
        let spy = Sinon.spy(deps.Svcs.Analytics, "page");
        onHashChange();

        expectCalledWith(spy, "/b#!/match/:arg", { arg: "abc" });
      });
    });
  });

  describe("Nav.go", function() {
    beforeEach(function() {
      stubGlobal("location", {
        pathname: "/b",
        hash: "",
        href: ""
      });
    });

    it("sets hash only if base is the same", function() {
      Nav.go("/b#!/a/b");
      expect(location.hash).to.equal("!/a/b");
      expect(location.href).to.equal("");
    });

    it("sets href if base is different", function() {
      Nav.go("/c#!/a/b");
      expect(location.hash).to.equal("");
      expect(location.href).to.equal("/c#!/a/b");
    });
  });
});
