import { expect } from "chai";
import { GuestSet, filter, match } from "./event-guests";

describe("Event guest helpers", () => {
  describe("GuestSet", () => {
    it("treats guests with same email as identical", () => {
      let g = new GuestSet([{
        displayName: "Bob",
        email: "person@esper.com"
      }]);
      g.push({
        displayName: "Robert",
        email: "person@esper.com"
      });

      expect(g.toList()).to.deep.equal([{
        displayName: "Robert",
        email: "person@esper.com"
      }]);
    });

    it("treats guests with the same normalized name as identical if " +
      "no email is present", () => {
      let g = new GuestSet([{
        displayName: "bob",
      }]);
      g.push({
        displayName: "BoB",
      });

      expect(g.toList()).to.deep.equal([{
        displayName: "BoB"
      }]);
    });
  });

  describe("filter", () => {
    it("returns true if name overlaps", () => {
      expect(filter({
        displayName: "Peter Griffin",
        email: "peter@quahog.com"
      }, "riff")).to.be.true;
    });

    it("returns true if email overlaps", () => {
      expect(filter({
        displayName: "Peter Griffin",
        email: "peter@quahog.com"
      }, "hog")).to.be.true;
    });

    it("returns false otherwise", () => {
      expect(filter({
        displayName: "Peter Griffin",
        email: "peter@quahog.com"
      }, "gibberish")).to.be.false;
    });
  });

  describe("match", () => {
    it("returns true if normalized name matches exactly", () => {
      expect(match({
        displayName: "Peter Griffin",
        email: "peter@quahog.com"
      }, "peter griffin")).to.be.true;
    });

    it("returns true if email overlaps", () => {
      expect(match({
        displayName: "Peter Griffin",
        email: "peter@quahog.com"
      }, "PETER@quahog.com")).to.be.true;
    });

    it("returns false otherwise", () => {
      expect(match({
        displayName: "Peter Griffin",
        email: "peter@quahog.com"
      }, "peter")).to.be.false;
    });
  });
});