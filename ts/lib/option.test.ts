import { expect } from "chai";
import { isSome, isNone, match, flatMap, flatten } from "./option";

describe("Options", function() {
  describe("isSome", function() {
    it("returns true for non-null objects", function() {
      expect(isSome(false)).to.be.true;
      expect(isSome([])).to.be.true;
      expect(isSome({})).to.be.true;
    });

    it("returns false for null and undefined objects", function() {
      expect(isSome(null)).to.be.false;
      expect(isSome(undefined)).to.be.false;
    });
  });

  describe("isNone", function() {
    it("returns false for non-null objects", function() {
      expect(isNone(false)).to.be.false;
      expect(isNone([])).to.be.false;
      expect(isNone({})).to.be.false;
    });

    it("returns true for null and undefined objects", function() {
      expect(isNone(null)).to.be.true;
      expect(isNone(undefined)).to.be.true;
    });
  });

  describe("match", function() {
    it("should match some values", function() {
      expect(match({x: 5}, {
        none: () => 0,
        some: (p) => p.x
      })).to.equal(5);
    });

    it("should match none values", function() {
      let o: {x: number}|null = <{x: number}|null> null;
      expect(match(o, {
        none: () => 0,
        some: (p: {x: number}) => p.x
      })).to.equal(0);
    });
  });

  describe("flatMap", function() {
    it("should allow monadic bind of non-null objects", function() {
      expect(flatMap(5, (n) => n + 1)).to.equal(6);
    });

    it("should preserve / not choke on null values", function() {
      let o: number|null = <number|null> null;
      expect(isNone(flatMap(o, (n) => n + 1))).to.be.true;
    });
  });

  describe("flatten", function() {
    it("should return a list with none objects filtered out", function() {
      let n: Array<number|null> = [null, 1, null, 2];
      expect(flatten(n)).to.deep.equal([1, 2]);
    });
  });
});
