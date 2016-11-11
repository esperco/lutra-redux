import { expect } from "chai";
import * as Name from "./name";

describe("nameChangeReducer", function() {
  it("changes name to given value without mutating state", function() {
    let s1: Name.NameState = { name: "Bob" };
    let s2 = Name.nameChangeReducer(s1, {
      type: "NAME_CHANGE",
      value: "Robert"
    });
    expect(s1.name).to.equal("Bob");
    expect(s2.name).to.equal("Robert");
  });
});

