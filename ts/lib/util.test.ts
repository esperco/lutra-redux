import { expect } from "chai";
import { roundStr, deepFreeze, hexDecode, hexEncode } from "./util";
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
