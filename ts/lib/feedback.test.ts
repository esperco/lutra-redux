import { expect } from "chai";
import { stubLogs } from "../fakes/stubs";
import { expand, toPick } from "./feedback";

describe("expand", () => {
  it("should not mutate existing patch or original state", () => {
    let patch = { stars: 4 };
    let original = { stars: 5 };
    expand(patch, original);
    expect(patch).to.deep.equal({ stars: 4 });
    expect(original).to.deep.equal({ stars: 5 });
  });

  it("should unset stars and tags if is_organizer", () => {
    let ret = expand({ is_organizer: true }, { stars: 5 });
    expect(ret).to.deep.equal({
      is_organizer: true,
      stars: null,
      agenda: null,
      on_time: null,
      good_time_mgmt: null,
      contributed: null,
      presence_useful: null,
      action_items: null,
      notes: null
    });
  });

  it("should unset stars and tags if didnt_attend", () => {
    let ret = expand({ didnt_attend: true }, { stars: 5 });
    expect(ret).to.deep.equal({
      didnt_attend: true,
      stars: null,
      agenda: null,
      on_time: null,
      good_time_mgmt: null,
      contributed: null,
      presence_useful: null,
      action_items: null,
      notes: null
    });
  });

  it("should unset is_organizer and didnt_attend if stars specified", () => {
    let ret = expand({ stars: 5 }, { didnt_attend: true, is_organizer: true });
    expect(ret).to.deep.equal({
      stars: 5,
      is_organizer: false,
      didnt_attend: false
    });
  });

  it("should nullify negative tags if changing to positive rating", () => {
    let ret = expand({ stars: 5, agenda: true }, { stars: 4 });
    expect(ret).to.deep.equal({
      stars: 5,
      agenda: true,
      on_time: null,
      good_time_mgmt: null,
      contributed: null,
      presence_useful: null,
      action_items: null
    });
  });

  it("should nullify positive tags if changing to negative rating", () => {
    let ret = expand({ stars: 4, action_items: false }, { stars: 5 });
    expect(ret).to.deep.equal({
      stars: 4,
      agenda: null,
      on_time: null,
      good_time_mgmt: null,
      contributed: null,
      presence_useful: null,
      action_items: false
    });
  });

  it("should not nullify tags if original undefined", () => {
    let ret = expand({ stars: 3 });
    expect(ret).to.deep.equal({
      stars: 3,
      is_organizer: false,
      didnt_attend: false
    });
  });

  it("should allow posting notes", () => {
    let ret = expand({ notes: "Hello" }, { stars: 3 });
    expect(ret).to.deep.equal({ notes: "Hello" });
  });

  it("should not update tags if negative rating stays negative", () => {
    let ret = expand({ stars: 3, good_time_mgmt: false }, { stars: 4 });
    expect(ret).to.deep.equal({
      stars: 3,
      good_time_mgmt: false
    });
  });

  it("should not update tags if positive rating stays positive", () => {
    let ret = expand({ good_time_mgmt: true }, { stars: 5 });
    expect(ret).to.deep.equal({
      good_time_mgmt: true
    });
  });
});

describe("toPick", () => {
  it("should log an error if undefined key", () => {
    let logs = stubLogs();
    toPick({ stars: undefined, didnt_attend: true });
    expect(logs.error.called).to.be.true;
  });

  it("should not log an error if all keys defined", () => {
    let logs = stubLogs();
    toPick({ stars: null, didnt_attend: true });
    expect(logs.error.called).to.not.be.true;
  });

  it("should remove undefined props", () => {
    stubLogs();
    let ret = toPick({ stars: undefined, didnt_attend: true });
    expect(ret).to.deep.equal({ didnt_attend: true });
  });
});