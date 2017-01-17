import { expect } from "chai";
import { GuestSet, filter } from "./event-guests";

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

    it("allows getByKey using name", () => {
      let guest = {
        displayName: "Robert",
        email: "bob@esper.com"
      };
      let guestSet = new GuestSet([guest]);
      expect(guestSet.getByKey("robert")).to.deep.equal(guest);
    });

    it("allows hasKey using name", () => {
      let guest = {
        displayName: "Robert",
        email: "bob@esper.com"
      };
      let guestSet = new GuestSet([guest]);
      expect(guestSet.hasKey("robert")).to.be.true;
    });
  });

  describe("filter", () => {
    const peter = {
      displayName: "Peter Griffin",
      email: "peter@quahog.co"
    };
    const peter2 = {
      displayName: "Peter Griffin II",
      email: "peter@quahog.co.uk"
    };
    const stewie = {
      displayName: "Stewie Griffin",
      email: "stewie@quahog.com"
    };

    it("returns exact matches as first return and remainder with overlap " +
       "for name", () => {
      expect(filter(
        new GuestSet([peter, peter2, stewie]),
        "Peter Griffin")
      ).to.deep.equal([peter, [peter2]]);
    });

    it("returns exact matches as first return and remainder with overlap " +
       "for e-mail", () => {
      expect(filter(
        new GuestSet([peter, peter2, stewie]),
        "peter@quahog.co")
      ).to.deep.equal([peter, [peter2]]);
    });

    it("returns undefined as first if no exact matches", () => {
       expect(filter(
        new GuestSet([peter, peter2, stewie]),
        "Peter")
      ).to.deep.equal([undefined, [peter, peter2]]);
    });
  });
});