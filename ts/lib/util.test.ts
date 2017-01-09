import { expect } from "chai";
import {
  roundStr, deepFreeze, hexDecode, hexEncode,
  compactObject, makeRecord, recordToList,
  OrderedSet
} from "./util";
import { sandbox } from "./sandbox";

describe("roundStr", function() {
  it("should return a rounded string", function() {
    expect(roundStr(125.521)).to.equal("126");
  });

  it("should allow rounding to a specific decimal place", function() {
    expect(roundStr(125.521, 1)).to.equal("125.5");
  });

  it("should get rid of trailing zeros", function() {
    expect(roundStr(123.001, 1)).to.equal("123");
  });
});

describe("deepFreeze", function() {
  it("should prevent shallow updates", function() {
    var o: any = deepFreeze({ x: 5 });
    o.x === 6;
    expect(o.x).to.equal(5);
  });

  it("should prevent shallow additions", function() {
    var o: any = deepFreeze({ x: 5 });
    o.y === 6;
    expect(o.y).to.be.undefined
  });

  it("should prevent deep updates", function() {
    var o: any = deepFreeze({ x: {y: 5 }});
    o.x.y === 6;
    expect(o.x.y).to.equal(5);
  });

  it("should prevent deep additions", function() {
    var o: any = deepFreeze({ x: {y: 5 }});
    o.x.z === 6;
    expect(o.x.z).to.be.undefined;
  });

  it("should not call isFrozen on non-objects", function() {
    let spy = sandbox.spy(Object, "isFrozen");
    expect(deepFreeze(5)).to.equal(5);
    expect(spy.called).to.be.false;
  });
});

describe("hexEncode / hexDecode", function() {
  it("should encode and decode each other", function() {
    var s = "Hello World";
    expect(hexDecode(hexEncode(s))).to.equal(s);
  });
});

describe("compactObject", function() {
  it("should remove undefined values but not other falsey values", function() {
    expect(compactObject({
      null: null,
      undefined: undefined,
      false: false,
      zero: 0
    })).to.deep.equal({
      null: null,
      false: false,
      zero: 0
    });
  });
});

describe("makeRecord", function() {
  it("should return a record map of a string list", function() {
    expect(makeRecord(["a", "b"])).to.deep.equal({
      a: true,
      b: true
    });
  });
});

describe("recordToList", function() {
  it("should add true values in a record in a string list", function() {
    expect(recordToList({
      a: true,
      b: false
    })).to.deep.equal(['a']);
  });
});

describe("OrderedSet", function() {
  describe("push", () => {
    it("appends new items to the end", () => {
      let o = new OrderedSet([1,2,3])
      o.push(4);
      expect(o.toList()).to.deep.equal([1, 2, 3, 4]);
    });

    it("does not add existing items", () => {
      let o = new OrderedSet([1,2,3])
      o.push(2);
      expect(o.toList()).to.deep.equal([1, 2, 3]);
    });

    it("replaces existing items with custom keys", () => {
      let o = new OrderedSet([
        {id: "A", val: 0}, {id: "B", val: 0}, {id: "C", val: 0}
      ], (x) => x.id);
      o.push({id: "B", val: 1});
      expect(o.toList()).to.deep.equal([
        {id: "A", val: 0}, {id: "B", val: 1}, {id: "C", val: 0}
      ]);
    });
  });

  describe("pull", () => {
    it("removes matching items by key", () => {
      let o = new OrderedSet([
        {id: "A", val: 0}, {id: "B", val: 0}, {id: "C", val: 0}
      ], (x) => x.id);
      o.pull({id: "B", val: 1});
      expect(o.toList()).to.deep.equal([
        {id: "A", val: 0}, {id: "C", val: 0}
      ]);
    });

    it("does not choke if items missing", () => {
      let o = new OrderedSet([
        {id: "A", val: 0}, {id: "B", val: 0}, {id: "C", val: 0}
      ], (x) => x.id);
      o.pull({id: "X", val: 0});
      expect(o.toList()).to.deep.equal([
        {id: "A", val: 0}, {id: "B", val: 0}, {id: "C", val: 0}
      ]);
    });
  });

  describe("map", () => {
    it("maps all defined values to new ones", () => {
      let o = new OrderedSet([0, 1, 2, 3]);
      o.pull(2);
      expect(o.map((n) => n * 2)).to.deep.equal([0, 2, 6]);
    });
  });

  describe("forEach", () => {
    it("invokes callback for each defined value", () => {
      let o = new OrderedSet([0, 1, 2, 3]);
      let ret: number[] = [];
      o.pull(2);
      o.forEach((n) => ret.push(n * 2));
      expect(ret).to.deep.equal([0, 2, 6]);
    });
  });

  describe("filter", () => {
    it("removes all values for which filter returns false", () => {
      let o = new OrderedSet([0, 1, 2, 3]);
      expect(o.filter((n) => n % 2 !== 0).toList())
        .to.deep.equal([1, 3]);
    });

    it("accepts a limit to its return value", () => {
      let o = new OrderedSet([0, 1, 2, 3, 4, 5, 6, 7]);
      expect(o.filter((n) => n % 2 !== 0, 3).toList())
        .to.deep.equal([1, 3, 5]);
    });
  });

  describe("sort", () => {
    it("sorts in place with a given key function", () => {
      let o = new OrderedSet([0, 1, 2, 3]);
      o.sort((n) => -n);
      expect(o.toList()).to.deep.equal([3, 2, 1, 0]);
    });

    it("sorts in place with original key function by default", () => {
      let o = new OrderedSet([3, 2, 1, 0], (n) => n.toString());
      o.sort();
      expect(o.toList()).to.deep.equal([0, 1, 2, 3]);
    });
  });

  describe("with", () => {
    it("adds items without mutating original", () => {
      let o1 = new OrderedSet([0, 1, 2, 3]);
      let o2 = o1.with(4, 5);
      expect(o1.toList()).to.deep.equal([0, 1, 2, 3]);
      expect(o2.toList()).to.deep.equal([0, 1, 2, 3, 4, 5]);
    });
  });

  describe("without", () => {
    it("removes items without mutating original", () => {
      let o1 = new OrderedSet([0, 1, 2, 3]);
      let o2 = o1.without(0, 1);
      expect(o1.toList()).to.deep.equal([0, 1, 2, 3]);
      expect(o2.toList()).to.deep.equal([2, 3]);
    });
  });
});
