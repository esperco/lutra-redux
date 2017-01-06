import { expect } from "chai";
import * as EventLabels from "./event-labels";
import makeEvent from "../fakes/events-fake";

describe("Event label helpers", () => {
  afterEach(() => { EventLabels.resetColors(); })

  const label1 = EventLabels.newLabel("Label 1");
  const label2 = EventLabels.newLabel("Label 2");
  const label3 = EventLabels.newLabel("Label 3");
  const label4 = EventLabels.newLabel("Label 4");

  describe("getLabelCounts", () => {
    it("returns a count of labels per event", () => {
      let { counts } = EventLabels.getLabelCounts([label1, label2], [
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
      let { labels } = EventLabels.getLabelCounts([label1, label2], [
        makeEvent({ id: "e1", labels: [label2, label3] }),
        makeEvent({ id: "e2", labels: [label3, label4] })
      ]);
      expect(labels.toList()).to.deep.equal(
        [label1, label2, label3, label4]
      );
    });

    it("returns a list of selected labels (attached to any event)", () => {
      let { selected } = EventLabels.getLabelCounts([label1, label2], [
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
      let { partial } = EventLabels.getLabelPartials([label1, label2], [
        makeEvent({ id: "e1", labels: [label2, label3] }),
        makeEvent({ id: "e2", labels: [label3, label4] })
      ]);
      expect(partial.toList()).to.deep.equal([label2, label4]);
    });
  });

  describe("filter", () => {
    it("matches any normalized substring of label", () => {
      expect(EventLabels.filter(label1, "ABe")).to.be.true;
      expect(EventLabels.filter(label1, "3")).to.be.false;
    });
  });

  describe("match", () => {
    it("returns true if its normalized form matches exactly", () => {
      expect(EventLabels.match(label2, "lABEl 2")).to.be.true;
    });

    it("returns false otherwise", () => {
      expect(EventLabels.match(label2, "ABe")).to.be.false;
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
