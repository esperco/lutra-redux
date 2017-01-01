import * as _ from "lodash";
import { expect } from "chai";
import { expectDeepIncludes } from "./expect-helpers";
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
      expect(labels.toList()).to.deep.equal([label1, label2, label3]);
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

    it("includes a union of user-chosen labels and hashtags", () => {
      let labels = EventLabels.getLabels(makeEvent({
        predicted_labels: [{
          label: label1,
          score: 0.8
        }],
        hashtags: [{
          hashtag: hashtag1,
        }, {
          hashtag: hashtag2,
          label: label3
        }],
        labels: [label2]
      }));

      expect(labels).to.have.length(3);
      expectDeepIncludes(labels, label2);
      expectDeepIncludes(labels, label3);

      let hashtag = _.find(labels,
        (l) => l.normalized === hashtag1.normalized);
      expect(hashtag && hashtag.original).to.equal(hashtag1.original);
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

  describe("updateEventLabels", () => {
    let event = makeEvent({
      labels: [label1],
      hashtags: [{
        hashtag: hashtag1
      }, {
        hashtag: hashtag2,
        label: label2
      }]
    });

    it("adds labels", () => {
      expect(EventLabels.updateEventLabels(event, {
        add: [label3]
      })).to.deep.equal({
        labels: [label1, label3],
        hashtags: event.hashtags
      });
    });

    it("removes labels", () => {
      expect(EventLabels.updateEventLabels(event, {
        rm: [label1]
      })).to.deep.equal({
        labels: [],
        hashtags: event.hashtags
      });
    });

    it("approves hashtags", () => {
      expect(EventLabels.updateEventLabels(event, {
        add: [hashtag1]
      })).to.deep.equal({
        labels: event.labels,
          hashtags: [{
          hashtag: hashtag1,
          approved: true
        }, {
          hashtag: hashtag2,
          label: label2
        }]
      });

      expect(EventLabels.updateEventLabels(event, {
        add: [label2]
      })).to.deep.equal({
        labels: event.labels,
          hashtags: [{
          hashtag: hashtag1
        }, {
          hashtag: hashtag2,
          label: label2,
          approved: true
        }]
      });
    });

    it("disapproves hashtags", () => {
      expect(EventLabels.updateEventLabels(event, {
        rm: [hashtag1]
      })).to.deep.equal({
        labels: event.labels,
          hashtags: [{
          hashtag: hashtag1,
          approved: false
        }, {
          hashtag: hashtag2,
          label: label2
        }]
      });

      expect(EventLabels.updateEventLabels(event, {
        rm: [label2]
      })).to.deep.equal({
        labels: event.labels,
          hashtags: [{
          hashtag: hashtag1
        }, {
          hashtag: hashtag2,
          label: label2,
          approved: false
        }]
      });
    });
  });
});
