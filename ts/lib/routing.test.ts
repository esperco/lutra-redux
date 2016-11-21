import { expect } from "chai";
import { Path, deparam } from "./routing";

describe("Routing", function() {
  describe("Path", function() {
    let path = new Path({
      base: "/b#!",
      params: { first: "", second: "" },
      query: { a: "", b: "" },
      toStr: (p) => "/path/" + p.first + "/" + p.second
    });

    describe("href", function() {
      it("returns path with base and params", function() {
        expect(path.href({ first: "One", second: "Two" }))
          .to.equal("/b#!/path/One/Two")
      });

      it("may include querystring", function() {
        expect(path.href({ first: "One", second: "Two" }, {
          a: "A",
          b: "?x=1"
        })).to.equal("/b#!/path/One/Two?a=A&b=%3Fx%3D1")
      });
    });

    describe("routePattern", function() {
      it("returns colon-denoted route patterns with base", function() {
        expect(path.routePattern()).to.equal("/path/:first/:second");
      });
    });
  });

  describe("deparam", function() {
    it("returns an object representing query string values", function() {
      expect(deparam("a=b&c=123")).to.deep.equal({
        a: "b",
        c: "123"
      });
    });

    it("handles URI encoding", function() {
      expect(deparam("a=b&c=%3Fx%3D1")).to.deep.equal({
        a: "b",
        c: "?x=1"
      });
    });

    it("handles null or empty values", function() {
      expect(deparam("a=b&c")).to.deep.equal({
        a: "b",
        c: ""
      });
    });
  });
});
