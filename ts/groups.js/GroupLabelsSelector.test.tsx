import * as React from 'react';
import { expect } from "chai";
import { shallow } from 'enzyme';
import * as Sinon from 'sinon';
import TagList from "../components/TagList";
import { testLabel } from "../fakes/labels-fake";
import * as ASN from "../lib/asn";
import * as Color from "../lib/colors";
import { LabelSet }from "../lib/event-labels";
import { sandbox } from "../lib/sandbox";
import { expectCalledWith } from "../lib/expect-helpers";
import GroupLabelsSelector from './GroupLabelsSelector';

describe("<GroupLabelsSelector />", () => {
  const label1 = testLabel("Label 1");
  const label2 = testLabel("Label 2");
  const label3 = testLabel("Label 3");
  const label4 = testLabel("Label 4");
  const defaultSelected: ASN.AllSomeNone = {
    some: {
      "Label 2": true,
      "Label 3": true,
      "Label 4": true
    }
  };

  beforeEach(() => {
    sandbox.stub(Color, "getColorForMap", () => label4.color);
  });

  var onChangeSpy: Sinon.SinonSpy;
  var onSubmitSpy: Sinon.SinonSpy;

  function getTagList(selected=defaultSelected) {
    onChangeSpy = Sinon.spy();
    onSubmitSpy = Sinon.spy();
    return shallow(<GroupLabelsSelector
      labels={new LabelSet([label1, label2, label3])}
      selected={selected}
      onChange={onChangeSpy}
      onSubmit={onSubmitSpy}
    />).find(TagList);
  }

  it("renders a taglist with choices with selected and base labels", () => {
    let wrapper = getTagList();
    expect(wrapper.prop('choices').toList()).to.deep.equal([
      label1, label2, label3, label4
    ]);
  });

  it("renders a taglist with selections based on ASN value", () => {
    let wrapper = getTagList();
    expect(wrapper.prop('selectedChoices').toList()).to.deep.equal([
      label2, label3, label4
    ]);
  });

  it("renders an option to select everything", () => {
    let wrapper = getTagList();
    expect(wrapper.prop('specialChoices')![0].selected).to.be.false;
    wrapper.prop('specialChoices')![0].onSelect(true, "click");
    expectCalledWith(onChangeSpy, { all: true, none: true });
  });

  // Expected behavior is to "uncheck" select all by clicking on other choices
  it("checks off select all if true, but clicking does not uncheck", () => {
    let wrapper = getTagList({ all: true, none: true });
    expect(wrapper.prop('specialChoices')![0].selected).to.be.true;
    wrapper.prop('specialChoices')![0].onSelect(false, "click");
    expectCalledWith(onChangeSpy, { all: true, none: true });
  });

  it("renders an option to select only unlabeled", () => {
    let wrapper = getTagList();
    expect(wrapper.prop('specialChoices')![1].selected).to.be.false;
    wrapper.prop('specialChoices')![1].onSelect(true, "click");
    expectCalledWith(onChangeSpy, { none: true });
  });

  it("checks off select none if true, but clicking does not uncheck", () => {
    let wrapper = getTagList({ none: true });
    expect(wrapper.prop('specialChoices')![1].selected).to.be.true;
    wrapper.prop('specialChoices')![1].onSelect(false, "click");
    expectCalledWith(onChangeSpy, { none: true });
  });

  it("disables select all if we select any label", () => {
    let wrapper = getTagList({ all: true, none: true });
    wrapper.prop('onToggle')(label2, true, "click");
    expectCalledWith(onChangeSpy, { some: { "Label 2": true } });
  });

  it("disables unlabeled selections if we select any label", () => {
    let wrapper = getTagList({ none: true });
    wrapper.prop('onToggle')(label2, true, "click");
    expectCalledWith(onChangeSpy, { some: { "Label 2": true } });
  });

  it("allows us to add new labels to ASN", () => {
    let wrapper = getTagList({ some: {"Label 2": true} });
    wrapper.prop('onAdd')!("New Label", "click");
    expectCalledWith(onChangeSpy, {
      some: {
        "Label 2": true,
        "New Label": true
      }
    });
  });

  it("defaults to select all if we unselect everything", () => {
    let wrapper = getTagList({ some: {"Label 2": true} });
    wrapper.prop('onToggle')(label2, false, "click");
    expectCalledWith(onChangeSpy, { all: true, none: true });
  });

  it("submits when dropdown closes", () => {
    let wrapper = getTagList();
    wrapper.prop('onClose')!();
    expect(onSubmitSpy.called).to.be.true;
  });
});
