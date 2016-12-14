import { expect } from "chai";
import {
  roundStr, deepFreeze, hexDecode, hexEncode,
  compactObject, makeRecord, recordToList
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
