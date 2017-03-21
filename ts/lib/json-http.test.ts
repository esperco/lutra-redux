// import * as _ from "lodash";
import { expect } from "chai";
import { expectCalledWith } from "./expect-helpers";
import { sandbox, stub as stubGlobal } from "./sandbox";
import { stubLogs, stubRAF } from "../fakes/stubs";
import { Deferred } from "./util";
import JsonHttp from "./json-http";
import * as Sinon from "sinon";

describe("JsonHttp", function() {
  function stubFetch() {
    var dfd = new Deferred();
    var stub = stubGlobal("fetch", function() {
      return dfd.promise();
    });
    return { dfd, stub };
  }

  function stubHeaders() {
    class Headers {
      _vals: {[index: string]: string};
      constructor(vals: {[index: string]: string} = {}) {
        this._vals = vals;
      }
      append(name: string, val: string) {
        this._vals[name] = val;
      }
    };
    return stubGlobal("Headers", Headers);
  }

  // Fake response class
  class Response {
    ok: boolean;
    constructor(public status: number, public body: string) {
      this.ok = status >= 200 && status < 300;
    }
    text() { return Promise.resolve(this.body); }
    json() { return Promise.resolve(JSON.parse(this.body)); }
  }

  var fetchDfd: Deferred<any>;
  var fetchStub: Sinon.SinonStub;
  beforeEach(function() {
    stubLogs();
    stubRAF();
    stubHeaders();
    let { dfd, stub } = stubFetch();
    fetchDfd = dfd; fetchStub = stub;
  });

  describe("get", function() {
    it("fetches using GET method", () => {
      JsonHttp.get("/some/path");
      expectCalledWith(fetchStub, "/some/path", {
        method: "GET",
        headers: new Headers()
      });
    });

    it("parses fetched JSON", (done) => {
      JsonHttp.get("/some/path").then((val) => {
        expect(val).to.deep.equal({ a: 1, b: 2 });
      }).then(done, done);
      fetchDfd.resolve(new Response(200, JSON.stringify({ a: 1, b: 2 })));
    });

    it("calls start handler with modData = false", function() {
      let startHandler = sandbox.stub(JsonHttp, "startHandler");
      JsonHttp.get("/some/path");
      let args = startHandler.args[0];
      expect(args[0]).to.be.a("string");
      expect(args[1]).to.be.false;
    });
  });

  describe("post", function() {
    it("sends data using POST method", () => {
      JsonHttp.post("/some/path", {x: 5});
      expectCalledWith(fetchStub, "/some/path", {
        method: "POST",
        headers: new Headers({
          "content-type": "application/json; charset=UTF-8"
        }),
        body: JSON.stringify({x: 5})
      });
    });

    it("calls start handler with modData = true", function() {
      let startHandler = sandbox.stub(JsonHttp, "startHandler");
      JsonHttp.post("/some/path", {x: 5});
      expect(startHandler.args[0][1]).to.be.true;
    });
  });

  describe("postGet", function() {
    it("sends data using POST method", () => {
      JsonHttp.postGet("/some/path", {x: 5});
      expectCalledWith(fetchStub, "/some/path", {
        method: "POST",
        headers: new Headers({
          "content-type": "application/json; charset=UTF-8"
        }),
        body: JSON.stringify({x: 5})
      });
    });

    it("calls start handler with modData = false", function() {
      let startHandler = sandbox.stub(JsonHttp, "startHandler");
      JsonHttp.postGet("/some/path", {x: 5});
      expect(startHandler.args[0][1]).to.be.false;
    });
  });

  describe("put", function() {
    it("sends data using PUT method", () => {
      JsonHttp.put("/some/path", {x: 5});
      expectCalledWith(fetchStub, "/some/path", {
        method: "PUT",
        headers: new Headers({
          "content-type": "application/json; charset=UTF-8"
        }),
        body: JSON.stringify({x: 5})
      });
    });

    it("calls start handler with modData = true", function() {
      let startHandler = sandbox.stub(JsonHttp, "startHandler");
      JsonHttp.put("/some/path", {x: 5});
      expect(startHandler.args[0][1]).to.be.true;
    });
  });

  describe("delete_", function() {
    it("sends message using DELETE method", () => {
      JsonHttp.delete_("/some/path");
      expectCalledWith(fetchStub, "/some/path", {
        method: "DELETE",
        headers: new Headers()
      });
    });

    it("calls start handler with modData = true", function() {
      let startHandler = sandbox.stub(JsonHttp, "startHandler");
      JsonHttp.delete_("/some/path");
      expect(startHandler.args[0][1]).to.be.true;
    });
  });

  describe("with an API secret", function() {
    beforeEach(function() {
      JsonHttp.setSecret("my-secret");
      sandbox.stub(Date, "now").callsFake(() => 1479846919000);
    });

    afterEach(function() {
      JsonHttp.apiSecret = undefined;
    });

    it("signs requests using the time", function() {
      JsonHttp.post("/some/path", {x: 5});
      expectCalledWith(fetchStub, "/some/path", {
        method: "POST",
        headers: new Headers({
          "Esper-Timestamp": "1479846919",
          "Esper-Path": "/some/path",
          "Esper-Signature": "037310a515ca4dc625d06c30658a5b6d04b95c41",
          "content-type": "application/json; charset=UTF-8"
        }),
        body: JSON.stringify({x: 5})
      });
    });
  });

  describe("with error callback", function() {
    it("calls error callback and modifies flow", (done) => {
      JsonHttp.get("/some/path", (err) => {
        return Promise.resolve({ a: 1, b: 2 })
      }).then((val) => {
        expect(val).to.deep.equal({ a: 1, b: 2 });
      }).then(done, done);
      fetchDfd.resolve(new Response(400, JSON.stringify({ error: true })));
    });
  });

  describe("global hooks", function() {
    var successHandler: Sinon.SinonStub;
    var errorHandler: Sinon.SinonStub;
    var startHandler: Sinon.SinonStub;
    var callbackPromise: Promise<any>;
    var apiPromise: Promise<any>;

    beforeEach(function() {
      startHandler = sandbox.stub(JsonHttp, 'startHandler');

      var dfd = new Deferred();
      callbackPromise = dfd.promise();

      // Wrap handler resolves in RAF so one firing also gives time for other
      // to finish firing as well
      successHandler = sandbox.stub(JsonHttp, 'successHandler')
      .callsFake(() => {
        window.requestAnimationFrame(() => dfd.resolve());
      });
      errorHandler = sandbox.stub(JsonHttp, 'errorHandler')
      .callsFake(() => {
        window.requestAnimationFrame(() => dfd.resolve());
      });
    });

    describe("on successful response", function() {
      beforeEach(function() {
        apiPromise = JsonHttp.post("/some/path", {x: 5});
        fetchDfd.resolve(new Response(200, JSON.stringify({ a: 1 })));
      });

      it("calls successHandler with same id as startHandler", function(done) {
        let id = startHandler.args[0][0];
        expect(id).to.be.a("string");

        // wrap in RAF since hooks are fired async
        callbackPromise.then(() => {
          expectCalledWith(successHandler, id);
          expect(errorHandler.called).to.be.false;
        }).then(done, done);
      });
    });

    describe("on unsuccessful response", function() {
      beforeEach(function() {
        apiPromise = JsonHttp.post("/some/path", {x: 5});
        fetchDfd.resolve(new Response(401, JSON.stringify({ b: 2 })));
      });

      it("calls errorHandler", function(done) {
        let id = startHandler.args[0][0];
        expect(id).to.be.a("string");

        callbackPromise.then(() => {
          expectCalledWith(errorHandler, id);
          expect(successHandler.called).to.be.false;
        }).then(done, done);
      });
    });

    describe("on unsuccessful response with successful error callback",
    function() {
      beforeEach(function() {
        apiPromise = JsonHttp.post("/some/path", {x: 5}, (err) => {
          return Promise.resolve({ b: 3 });
        });
        fetchDfd.resolve(new Response(401, JSON.stringify({ b: 2 })));
      });

      it("calls successHandler", function(done) {
        let id = startHandler.args[0][0];
        expect(id).to.be.a("string");

        callbackPromise.then(() => {
          expectCalledWith(successHandler, id);
          expect(errorHandler.called).to.be.false;
        }).then(done, done);
      });
    });

    describe("on unsuccessful response with unsuccessful error callback",
    function() {
      beforeEach(function() {
        apiPromise = JsonHttp.post("/some/path", {x: 5}, (err) => {
          return Promise.reject(new Error("Bleh"));
        });
        fetchDfd.resolve(new Response(401, JSON.stringify({ b: 2 })));
      });

      it("calls errorHandler", function(done) {
        let id = startHandler.args[0][0];
        expect(id).to.be.a("string");

        callbackPromise.then(() => {
          expectCalledWith(errorHandler, id);
          expect(successHandler.called).to.be.false;
        }).then(done, done);
      });
    });
  });

  describe("batch", function() {
    it("makes only one call", function() {
      JsonHttp.batch(function() {
        JsonHttp.get("/get/path");
        JsonHttp.post("/post/path", { post: "data" });
      }, "/batch/path");

      expectCalledWith(fetchStub, "/batch/path", {
        method: "POST",
        headers: new Headers({
          "content-type": "application/json; charset=UTF-8"
        }),
        body: JSON.stringify({
          requests: [{
            request_method: "GET",
            request_uri: "/get/path"
          }, {
            request_method: "POST",
            request_uri: "/post/path",
            request_body: { post: "data" }
          }]
        })
      });
    });

    it("resolves each promise individually", function(done) {
      let dfd1 = new Deferred();
      let dfd2 = new Deferred();

      // Batch lets us succeed with one but error with another
      JsonHttp.batch(function() {
        JsonHttp.get("/get/path")
          .then((x) => expect(x).to.deep.equal({a: 1}))
          .then(() => dfd1.resolve(), (x) => dfd1.reject(x))
          .catch(console.error);

        JsonHttp.post("/post/path", { post: "data" })
          .then(() => {
            throw new Error("Should not succeed");
          }, (err) => {
            expect(err.code).to.equal(432);
            expect(err.respBody).to.equal(JSON.stringify({ b: 2 }));
          })
          .then(() => dfd2.resolve(), (x) => dfd2.reject(x))
          .catch(console.error);
      }, "/batch/path");

      fetchDfd.resolve(new Response(200, JSON.stringify({
        responses: [
          { response_status: 200, response_body: { a: 1 } },
          { response_status: 432, response_body: { b: 2 } }
        ]
      })));

      Promise.all([dfd1.promise(), dfd2.promise()])
        .then(() => null)
        .then(done, done);
    });

    it("should return its value only after batch promise resolves",
    function(done) {
      let p = JsonHttp.batch(function() {
        JsonHttp.get("/get/path");
        JsonHttp.post("/post/path", { post: "data" });
        return 123;
      }, "/batch/path");

      fetchDfd.resolve(new Response(200, JSON.stringify({
        responses: [
          { response_status: 200, response_body: { a: 1 } },
          { response_status: 432, response_body: { b: 2 } }
        ]
      })));

      p.then((x) => {
        expect(x).to.equal(123);
      }).then(done, done);
    });

    it("should allow nesting", function() {
      JsonHttp.batch(function() {
        JsonHttp.get("/get/path");
        JsonHttp.batch(function() {
          JsonHttp.post("/post/path", { post: "data" });
        }, "/batch/path");
      }, "/batch/path");

      expectCalledWith(fetchStub, "/batch/path", {
        method: "POST",
        headers: new Headers({
          "content-type": "application/json; charset=UTF-8"
        }),
        body: JSON.stringify({
          requests: [{
            request_method: "GET",
            request_uri: "/get/path"
          }, {
            request_method: "POST",
            request_uri: "/post/path",
            request_body: { post: "data" }
          }]
        })
      });
    });
  });
});