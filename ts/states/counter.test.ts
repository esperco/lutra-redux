import { expect } from "chai";
import * as Counter from "./counter";

describe("incrReducer", function() {
  it("increments counter by given value without mutating state", function() {
    let s1: Counter.CounterState = { counter: 5 };
    let s2 = Counter.incrReducer(s1, {
      type: "INCR",
      value: 2
    });
    expect(s1.counter).to.equal(5);
    expect(s2.counter).to.equal(7);
  });
});

