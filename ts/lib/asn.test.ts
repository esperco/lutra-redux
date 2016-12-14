import { expect } from "chai";
import * as ASN from "./asn";

describe("AllSomeNone", () => {
  describe("apply", () => {
    it("matches an all selector to any non-empty set", () => {
      expect(ASN.apply(['hello'], { all: true })).to.deep.equal(['hello']);
    });

    it("doesn't match an all selector to an empty set", () => {
      expect(ASN.apply([], { all: true })).to.not.be.ok;
    });

    it("matches a none selector to an empty set", () => {
      expect(ASN.apply(['hello'], { none: true })).to.not.be.ok;
    });

    it("doesn't match a none selector to a non-empty set", () => {
      expect(ASN.apply([], { none: true })).to.deep.equal([]);
    });

    it("matches a some selector if any overlap", () => {
      expect(
        ASN.apply(['hello', 'world'], {some: { world: true }})
      ).to.deep.equal(['world']);
    });

    it("doesn't match a some selector if no overlap", () => {
      expect(
        ASN.apply(['hello', 'planet'], {some: { world: true }})
      ).to.not.be.ok;
    });

    it("matches if any combination of all-some-none match", () => {
      expect(
        ASN.apply(['hello', 'world'], {some: { world: true }, none: true})
      ).to.deep.equal(['world']);

      expect(
        ASN.apply([], {some: { world: true }, none: true})
      ).to.deep.equal([]);

      expect(
        ASN.apply(['hello', 'planet'], {some: { world: true }, none: true})
      ).to.not.be.ok;
    });
  });

  describe("isSelected", () => {
    it("returns true if all is selected", () => {
      expect(
        ASN.isSelected({ all: true, some: { c2: true }}, 'c1')
      ).to.be.true;
    });

    it("returns true if key is in some", () => {
      expect(
        ASN.isSelected({ some: { c1: true }}, 'c1')
      ).to.be.true;
    });

    it("returns false otherwise", () => {
      expect(
        ASN.isSelected({ some: { c1: false }}, 'c1')
      ).to.be.false;
      expect(ASN.isSelected({}, 'c1')).to.be.false;
    });
  });

  describe("update", () => {
    it("updates the all selector", () => {
      expect(
        ASN.update({ none: true }, { all: true }, ['c1', 'c2'])
      ).to.deep.equal({
        all: true,
        none: true
      });

      expect(
        ASN.update({ all: false }, { all: true }, ['c1', 'c2'])
      ).to.deep.equal({
        all: true
      });

      expect(
        ASN.update({ all: true }, { all: false }, ['c1', 'c2'])
      ).to.deep.equal({});
    });

    it("updates the none selector", () => {
      expect(
        ASN.update({ none: false }, { none: true }, ['c1', 'c2'])
      ).to.deep.equal({
        none: true
      });

      expect(
        ASN.update({ all: true }, { none: true }, ['c1', 'c2'])
      ).to.deep.equal({
        all: true,
        none: true
      });
    });

    it("updates the some selector by merging", () => {
      expect(ASN.update(
        { some: { c2: true } },
        { some: { c1: true } },
        ['c1', 'c2', 'c3']
      )).to.deep.equal({
        some: { c1: true, c2: true }
      });
    });

    it("removes extraneous properties on the some selector", () => {
      expect(ASN.update(
        { some: { c1: true, c2: true } },
        { some: { c1: false } },
        ['c1', 'c2', 'c3']
      )).to.deep.equal({
        some: { c2: true }
      });
    });

    it("removes all falsey values from selector", () => {
      expect(ASN.update(
        { all: true, some: { c1: true }, none: true },
        { all: false, some: { c1: false }, none: false },
        ['c1', 'c2']
      )).to.deep.equal({});
    });

    it("selects all if all choices are specified", () => {
      expect(ASN.update(
        { some: { c1: true } },
        { some: { c2: true } },
        ['c1', 'c2']
      )).to.deep.equal({ all: true });
    });

    it("deselects all if a choice becomes falsey", () => {
      expect(ASN.update(
        { all: true },
        { some: { c2: false } },
        ['c1', 'c2']
      )).to.deep.equal({ some: { c1: true } });
    });

    it("handles non-specified choices gracefully", () => {
      expect(ASN.update(
        { some: { b1: true } },
        { some: { c2: true } },
        ['c1', 'c2']
      )).to.deep.equal({
        some: { b1: true, c2: true }
      });
    });
  });

  describe("ASNParam", () => {
    it("stringifies and de-stringifies values with all", () => {
      let val = { all: true };
      let str = ASN.AllSomeNoneParam.toStr(val);
      expect(ASN.AllSomeNoneParam.clean(str)).to.deep.equal(val);
    });

    it("stringifies and de-stringifies values with none", () => {
      let val = { none: true };
      let str = ASN.AllSomeNoneParam.toStr(val);
      expect(ASN.AllSomeNoneParam.clean(str)).to.deep.equal(val);
    });

    it("stringifies and de-stringifies values with some", () => {
      let val = { some: { x: true, y: true } };
      let str = ASN.AllSomeNoneParam.toStr(val);
      expect(ASN.AllSomeNoneParam.clean(str)).to.deep.equal(val);
    });

    it("stringifies and de-stringifies values with some and none", () => {
      let val = { some: { x: true, y: true }, none: true };
      let str = ASN.AllSomeNoneParam.toStr(val);
      expect(ASN.AllSomeNoneParam.clean(str)).to.deep.equal(val);
    });

    it("stringifies and de-stringifies values with all and none", () => {
      let val = { all: true, none: true };
      let str = ASN.AllSomeNoneParam.toStr(val);
      expect(ASN.AllSomeNoneParam.clean(str)).to.deep.equal(val);
    });
  })
});

