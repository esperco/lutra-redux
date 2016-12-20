import * as _ from "lodash";
import { expect } from "chai";
import * as EventLabels from "./event-labels";
import makeEvent from "../fakes/events-fake";

describe("Event label helpers", () => {
  afterEach(() => { EventLabels.resetColors(); })

  const label1 = EventLabels.newLabel("Label 1");
  const label2 = EventLabels.newLabel("Label 2");
  const label3 = EventLabels.newLabel("Label 3");
  const label4 = EventLabels.newLabel("Label 4");
  const hashtag1 = { original: "#Hashtag1", normalized: "#hashtag1"};
  const hashtag2 = { original: "#Hashtag2", normalized: "#hashtag2"};
  const hashtag3 = { original: "#Hashtag3", normalized: "#hashtag3"};

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
      expect(labels).to.deep.equal([label1, label2, label3, label4]);
    });

    it("includes predicted labels on events", () => {
      let { labels, counts } = EventLabels.getLabelCounts([label1, label2], [
        makeEvent({ predicted_labels: [{
          label: label3,
          score: 0.99
        }] }),
      ]);
      expect(counts).to.deep.equal({
        [label1.normalized]: 0,
        [label2.normalized]: 0,
        [label3.normalized]: 1
      });
      expect(labels).to.deep.equal([label1, label2, label3]);
    });
  });

  describe("getLabelSelections", () => {
    it("returns counts in true/false/some form", () => {
      let { selections } = EventLabels.getLabelSelections([label1, label2], [
        makeEvent({ id: "e1", labels: [label2, label3] }),
        makeEvent({ id: "e2", labels: [label3, label4] })
      ]);
      expect(selections).to.deep.equal({
        [label1.normalized]: false,
        [label2.normalized]: "some",
        [label3.normalized]: true,
        [label4.normalized]: "some"
      });
    });
  });

  describe("getLabels", () => {
    it("includes predicted labels with scores over 0.5", () => {
      expect(EventLabels.getLabels(makeEvent({
        predicted_labels: [{
          label: label1,
          score: 0.8
        }, {
          label: label2,
          score: 0.6
        }, {
          label: label3,
          score: 0.4
        }]
      }))).to.deep.equal([label1, label2]);
    });

    it("includes non-false hashtags over predicted labels", () => {
      let labels = EventLabels.getLabels(makeEvent({
        predicted_labels: [{
          label: label1,
          score: 0.8
        }],
        hashtags: [{
          hashtag: hashtag1,
          approved: true
        }, {
          hashtag: hashtag2,
          approved: false
        }, {
          hashtag: hashtag3
        }]
      }));

      // Uses hashtag norm + original, but defers to colors
      expect(labels).to.have.length(2);
      expect(labels[0].color).to.be.ok;
      expect(labels[1].color).to.be.ok;
      expect(_.map(labels,
        (l) => ({ normalized: l.normalized, original: l.original })
      )).to.deep.equal([hashtag1, hashtag3]);
    });

    it("uses hashtag matched to a label", () => {
      expect(EventLabels.getLabels(makeEvent({
        hashtags: [{
          hashtag: hashtag1,
          label: label1
        }]
      }))).to.deep.equal([label1]);
    });

    it("includes user-chosen labels over everything else", () => {
      expect(EventLabels.getLabels(makeEvent({
        predicted_labels: [{
          label: label1,
          score: 0.8
        }],
        hashtags: [{
          hashtag: hashtag1,
        }],
        labels: [label2]
      }))).to.deep.equal([label2]);
    });
  });

  describe("filterLabels", () => {
    it("matches any normalized substring of label", () => {
      expect(EventLabels.filterLabels([label1, label2], "ABe"))
        .to.deep.equal([label1, label2])
      expect(EventLabels.filterLabels([label1, label2], "2"))
        .to.deep.equal([label2])
    });
  });

  describe("match", () => {
    it("returns a label if its normalized form matches exactly", () => {
      expect(EventLabels.match([label1, label2], "lABEl 2"))
        .to.deep.equal(label2);
    });

    it("returns undefined otherwise", () => {
       expect(EventLabels.match([label1, label2], "a"))
        .to.be.undefined;
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
