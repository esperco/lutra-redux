import { expect } from "chai";
import * as EventLabels from "./event-labels";
import makeEvent from "../fakes/events-fake";
import { testLabel } from "../fakes/labels-fake";

let { LabelSet } = EventLabels;

describe("Event label helpers", () => {
  const label1 = testLabel("Label 1");
  const label2 = testLabel("Label 2");
  const label3 = testLabel("Label 3");
  const label4 = testLabel("Label 4");
  const label21 = testLabel("Label 21");

  describe("getLabelCounts", () => {
    it("returns a count of labels per event", () => {
      let { counts } = EventLabels.getLabelCounts(
        new LabelSet([label1, label2]), [
          makeEvent({ id: "e1", labels: [label2, label3] }),
          makeEvent({ id: "e2", labels: [label3, label4] })
        ]);
      expect(counts).to.deep.equal({
        [label1.normalized]: 0,
        [label2.normalized]: 1,
        [label3.normalized]: 2,
        [label4.normalized]: 1
      });
    });

    it("returns a list of labels ordered by base order, " +
       "then by event appearance", () => {
      let { labels } = EventLabels.getLabelCounts(
        new LabelSet([label1, label2]), [
          makeEvent({ id: "e1", labels: [label2, label3] }),
          makeEvent({ id: "e2", labels: [label3, label4] })
        ]);
      expect(labels.toList()).to.deep.equal(
        [label1, label2, label3, label4]
      );
    });

    it("returns a list of selected labels (attached to any event)", () => {
      let { selected } = EventLabels.getLabelCounts(
        new LabelSet([label1, label2]),
        [
          makeEvent({ id: "e1", labels: [label2, label3] }),
          makeEvent({ id: "e2", labels: [label3, label4] })
        ]);
      expect(selected.toList()).to.deep.equal(
        [label2, label3, label4]
      );
    });
  });

  describe("getLabelPartials", () => {
    it("returns labels that are partially selected", () => {
      let { partial } = EventLabels.getLabelPartials(
        new LabelSet([label1, label2]), [
          makeEvent({ id: "e1", labels: [label2, label3] }),
          makeEvent({ id: "e2", labels: [label3, label4] })
        ]);
      expect(partial.toList()).to.deep.equal([label2, label4]);
    });
  });

  describe("filter", () => {
    it("returns exact matches as first return and remainder as second", () => {
      expect(EventLabels.filter(
        new EventLabels.LabelSet([label1, label2, label21]), "lABEl 2"
      )).to.deep.equal([label2, [label21]]);
    });

    it("returns undefined as first if no exact mathces", () => {
      expect(EventLabels.filter(
        new EventLabels.LabelSet([label1, label2, label21]), "lABEl"
      )).to.deep.equal([undefined, [label1, label2, label21]]);
    });
  });

  describe("normalize", () => {
    it("doesn't match different labels together", () => {
      expect(EventLabels.normalize("Label 1"))
        .to.not.equal(EventLabels.normalize("Label 2"));
    });

    it("ignores trim and case", () => {
      expect(EventLabels.normalize("  LABEL 2   "))
        .to.equal(EventLabels.normalize("Label 2"));
    });
  });

  describe("newLabel", () => {
    it("normalizes and assigns a color to original label copy", () => {
      let original = " LABEL 99 ";
      let label = EventLabels.newLabel(original);
      expect(label.original).to.equal(original);
      expect(label.normalized).to.equal(EventLabels.normalize(original));
      expect(label.color).to.be.ok;
    });
  });

  describe("updateLabelList", () => {
    it("adds new labels and sorts by normalized form", () => {
      expect(EventLabels.updateLabelList([label1, label3], {
        add: [label2, label4]
      })).to.deep.equal([label1, label2, label3, label4])
    });

    it("removes labels", () => {
      expect(EventLabels.updateLabelList([label1, label2], {
        rm: [label1]
      })).to.deep.equal([label2])
    });

    it("updates existing labels added with slight variations", () => {
      let label1a = { ...label1, original: "LABEL 1!!!!!!!" };
      expect(EventLabels.updateLabelList([label1, label2], {
        add: [label1a]
      })).to.deep.equal([label1a, label2])
    });

    it("doesn't mutate original list", () => {
      let original = [label1];
      EventLabels.updateLabelList(original, {
        add: [label2],
        rm: [label1]
      });
      expect(original).to.deep.equal([label1]);
    });
  });
});
