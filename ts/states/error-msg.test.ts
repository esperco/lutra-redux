import { expect } from "chai";
import {
  expectDeepIncludes, expectNotDeepIncludes
} from "../lib/expect-helpers";
import { ErrorDetails } from "../lib/errors";
import * as ErrorMsg from "./error-msg";

describe("errorReducer", function() {
  it("adds errors to list without mutating state", function() {
    let s1: ErrorMsg.ErrorMsgState = { };
    let s2 = ErrorMsg.errorReducer(s1, {
      type: "ADD_ERROR",
      code: 400,
      details: { tag: "Invalid_authentication_headers" }
    });
    expect(s1.errors).to.be.undefined;
    expect(s2.errors).to.deep.equal([{
      code: 400,
      details: { tag: "Invalid_authentication_headers" }
    }]);
  });

  it("replaces multiple copies of an error with the same tag", function() {
    let s1: ErrorMsg.ErrorMsgState = { };

    let detail2: ErrorDetails = {
      tag: "Login_required",
      value: {
        uid: "uid1",
        email: "email@email.com"
      }
    };
    let s2 = ErrorMsg.errorReducer(s1, {
      type: "ADD_ERROR",
      code: 400,
      details: detail2
    });

    let detail3: ErrorDetails = {
      tag: "Login_required",
      value: {
        uid: "uid2",
        email: "email2@email.com"
      }
    };
    let s3 = ErrorMsg.errorReducer(s2, {
      type: "ADD_ERROR",
      code: 400,
      details: detail3
    });

    let detail4: ErrorDetails = { tag: "Invalid_authentication_headers" };
    let s4 = ErrorMsg.errorReducer(s3, {
      type: "ADD_ERROR",
      code: 400,
      details: detail4
    });

    expectNotDeepIncludes(s4.errors || [], {
      code: 400,
      details: detail2
    });
    expectDeepIncludes(s4.errors || [], {
      code: 400,
      details: detail3
    });
    expectDeepIncludes(s4.errors || [], {
      code: 400,
      details: detail4
    });
  });

  it("does not add multiple copies an error with the same status code " +
     "if no detail is provided", function() {
    let s1: ErrorMsg.ErrorMsgState = { };
    let s2 = ErrorMsg.errorReducer(s1, {
      type: "ADD_ERROR",
      code: 400
    });
    let s3 = ErrorMsg.errorReducer(s2, {
      type: "ADD_ERROR",
      code: 400,
      details: { tag: "Invalid_authentication_headers" }
    });
    let s4 = ErrorMsg.errorReducer(s3, {
      type: "ADD_ERROR",
      code: 400
    });

    expectDeepIncludes(s4.errors || [], {
      code: 400,
    });
    expectDeepIncludes(s4.errors || [], {
      code: 400,
      details: <ErrorDetails> { tag: "Invalid_authentication_headers" }
    });
    expect((s4.errors || []).length).to.equal(2);
  });

  it("removes errors from list by tag without mutating state", function() {
    let d1: ErrorDetails = {tag: "Payment_required"};
    let d2: ErrorDetails = {tag: "Invalid_authentication_headers"};
    let s1: ErrorMsg.ErrorMsgState = {
      errors: [
        { code: 400, details: d1 },
        { code: 400, details: d2 }
      ]
    };
    let s2 = ErrorMsg.errorReducer(s1, {
      type: "RM_ERROR",
      value: d1.tag
    });
    expectDeepIncludes(s1.errors || [], { code: 400, details: d1 });
    expectNotDeepIncludes(s2.errors || [], { code: 400, details: d1 });
    expectDeepIncludes(s2.errors || [], { code: 400, details: d2 });
  });

  it("removes errors from list by code without mutating state", function() {
    let d1: ErrorDetails = {tag: "Invalid_authentication_headers"};
    let s1: ErrorMsg.ErrorMsgState = {
      errors: [
        { code: 400, details: d1 },
        { code: 400 }
      ]
    };
    let s2 = ErrorMsg.errorReducer(s1, {
      type: "RM_ERROR",
      value: 400
    });
    expectDeepIncludes(s1.errors || [], { code: 400 });
    expectNotDeepIncludes(s2.errors || [], { code: 400 });
    expectDeepIncludes(s2.errors || [], { code: 400, details: d1 });
  });
});
