import { expect } from "chai";
import { updateInviteStateReducer } from "./invite-emails";
import { deepFreeze } from "../lib/util";

describe("updateInviteStateReducer", () => {
  const email1 = "email1@example.com";
  const email2 = "email2@example.com";
  const email3 = "email3@example.com";

  it("updates state to FETCHING from nothing", () => {
    expect(updateInviteStateReducer(deepFreeze({}), {
      type: "UPDATE_INVITE_EMAILS",
      inviteEmails: "FETCHING"
    })).to.deep.equal({
      inviteEmails: "FETCHING"
    });
  });

  it("does not replace existing data with FETCHING", () => {
    expect(updateInviteStateReducer(deepFreeze({
      inviteEmails: { [email1]: true as true }
    }), {
      type: "UPDATE_INVITE_EMAILS",
      inviteEmails: "FETCHING"
    })).to.deep.equal({
      inviteEmails: { [email1]: true as true }
    });
  });

  it("updates FETCHING to FETCH_ERROR", () => {
    expect(updateInviteStateReducer(deepFreeze({
      inviteEmails: "FETCHING" as "FETCHING"
    }), {
      type: "UPDATE_INVITE_EMAILS",
      inviteEmails: "FETCH_ERROR"
    })).to.deep.equal({
      inviteEmails: "FETCH_ERROR"
    });
  });

  it("updates FETCH_ERROR to FETCHING", () => {
    expect(updateInviteStateReducer(deepFreeze({
      inviteEmails: "FETCH_ERROR" as "FETCH_ERROR"
    }), {
      type: "UPDATE_INVITE_EMAILS",
      inviteEmails: "FETCHING"
    })).to.deep.equal({
      inviteEmails: "FETCHING"
    });
  });

  it("replaces FETCHING with data", () => {
    expect(updateInviteStateReducer(deepFreeze({
      inviteEmails: "FETCHING" as "FETCHING"
    }), {
      type: "UPDATE_INVITE_EMAILS",
      inviteEmails: { [email1]: true, [email2]: true }
    })).to.deep.equal({
      inviteEmails: { [email1]: true, [email2]: true }
    });
  });

  it("merges existing data", () => {
    expect(updateInviteStateReducer(deepFreeze({
      inviteEmails: {
        [email1]: true as true,
        [email2]: true as true
      }
    }), {
      type: "UPDATE_INVITE_EMAILS",
      inviteEmails: { [email2]: true, [email3]: true }
    })).to.deep.equal({
      inviteEmails: {
        [email1]: true,
        [email2]: true,
        [email3]: true
      }
    });
  });
});

