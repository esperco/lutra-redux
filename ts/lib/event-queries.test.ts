import { expect } from "chai";
import * as Queries from "./event-queries";

describe("Event Queries", () => {
  describe("stringify", () => {
    it("returns different strings for different queries", () => {
      let s1 = Queries.stringify({
        labels: { some: {b: true} }
      });
      let s2 = Queries.stringify({
        labels: { some: {a: true} }
      });
      expect(s1).not.to.equal(s2);
    });

    it("stringifies consistently regardless of undefined values", () => {
      let s1 = Queries.stringify({
        labels: undefined,
        contains: undefined,
        participants: undefined,
        minCost: undefined
      });
      let s2 = Queries.stringify({});
      expect(s1).to.equal(s2);
    });

    it("treats minCost = 0 and minCost = 1 as undefined", () => {
      let s1 = Queries.stringify({
        minCost: undefined
      });
      let s2 = Queries.stringify({
        minCost: 0
      });
      let s3 = Queries.stringify({
        minCost: 1
      });
      expect(s1).to.equal(s2);
      expect(s1).to.equal(s3);
    });

    it("treats label undefined and fetch both all labels as the same", () => {
      let s1 = Queries.stringify({
        labels: { all: true }
      });
      let s2 = Queries.stringify({});
      expect(s1).to.equal(s2);
    });

    it("treats empty string filter as undefined filter", () => {
      let s1 = Queries.stringify({
        contains: ""
      });
      let s2 = Queries.stringify({});
      expect(s1).to.equal(s2);
    });
  });

  describe("toAPI", () => {
    const start = new Date("2016-11-01");
    const end = new Date("2016-11-02");

    it("converts start/end timestamps correctly and " +
       "omits labels field if selecting all", () => {
      expect(Queries.toAPI(start, end, {
        labels: { all: true, none: true }
      })).to.deep.equal({
        window_start: "2016-11-01T00:00:00.000Z",
        window_end: "2016-11-02T00:00:00.000Z"
      });
    });

    it("corrects labels.some to API form", () => {
      expect(Queries.toAPI(start, end, {
        labels: { some: { a: true, b: false, c: true } }
      })).to.deep.equal({
        window_start: "2016-11-01T00:00:00.000Z",
        window_end: "2016-11-02T00:00:00.000Z",
        labels: ["Or", [["Label", "a"], ["Label", "c"]]]
      });
    });

    it("omits unlabeled if selecting only all", () => {
       expect(Queries.toAPI(start, end, {
        labels: { all: true }
      })).to.deep.equal({
        window_start: "2016-11-01T00:00:00.000Z",
        window_end: "2016-11-02T00:00:00.000Z",
        labels: ["Not", "No_label"]
      });
    });

     it("includes labels.none with some values", () => {
       expect(Queries.toAPI(start, end, {
        labels: { some: { a: true }, none: true }
      })).to.deep.equal({
        window_start: "2016-11-01T00:00:00.000Z",
        window_end: "2016-11-02T00:00:00.000Z",
        labels: ["Or", [["Label", "a"], "No_label"]]
      });
    });

    it("includes 'contains' string", () => {
      expect(Queries.toAPI(start, end, {
        labels: { all: true, none: true },
        contains: "Hello"
      })).to.deep.equal({
        window_start: "2016-11-01T00:00:00.000Z",
        window_end: "2016-11-02T00:00:00.000Z",
        contains: "Hello"
      });
    });

    it("includes participants, if any", () => {
      expect(Queries.toAPI(start, end, {
        labels: { all: true, none: true },
        participants: ["Bob", "ann@example.com"]
      })).to.deep.equal({
        window_start: "2016-11-01T00:00:00.000Z",
        window_end: "2016-11-02T00:00:00.000Z",
        participants: ["Bob", "ann@example.com"]
      });
    });
  });
});
