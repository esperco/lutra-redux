import * as React from 'react';
import { expect } from "chai";
import { shallow } from 'enzyme';
import * as Sinon from 'sinon';
import TagList from "../components/TagList";
import { normalize, GuestSet } from "../lib/event-guests";
import { expectCalledWith } from "../lib/expect-helpers";
import GroupGuestsSelector from './GroupGuestsSelector';

describe("<GroupGuestsSelector />", () => {
  const guest1 = {
    displayName: "Guest 1",
    email: "g1@example.com"
  };
  const guest1Choice = {
    original: "Guest 1",
    normalized: "g1@example.com"
  };
  const guest2 = {
    displayName: "Guest 2",
    email: "g2@example.com"
  };
  const guest2Choice = {
    original: "Guest 2",
    normalized: "g2@example.com"
  };
  const guest3 = {
    email: "g3@example.com"
  };
  const guest3Choice = {
    original: "g3@example.com",
    normalized: "g3@example.com"
  };
  const guest4 = {
    displayName: "Random Name"
  };
  const guest4Choice = {
    original: "Random Name",
    normalized: "random name"
  };
  const defaultSelected = [
    "g2@example.com",
    "g3@example.com",
    "Random Name"
  ];

  var onChangeSpy: Sinon.SinonSpy;
  var onSubmitSpy: Sinon.SinonSpy;

  function getTagList(selected=defaultSelected) {
    onChangeSpy = Sinon.spy();
    onSubmitSpy = Sinon.spy();
    return shallow(<GroupGuestsSelector
      guests={new GuestSet([guest1, guest2, guest3])}
      selected={selected}
      onChange={onChangeSpy}
      onSubmit={onSubmitSpy}
    />).find(TagList);
  }

  it("renders a taglist with choices with selected and base guests", () => {
    let wrapper = getTagList();
    expect(wrapper.prop('choices').toList()).to.deep.equal([
      guest1Choice, guest2Choice, guest3Choice, guest4Choice
    ]);
  });

  it("renders a taglist with selections based on ASN value", () => {
    let wrapper = getTagList();
    expect(wrapper.prop('selectedChoices').toList()).to.deep.equal([
      guest2Choice, guest3Choice, guest4Choice
    ]);
  });

  it("renders an option to select everything", () => {
    let wrapper = getTagList();
    expect(wrapper.prop('specialChoices')![0].selected).to.be.false;
    wrapper.prop('specialChoices')![0].onSelect(true, "click");
    expectCalledWith(onChangeSpy, []);
  });

  // Expected behavior is to "uncheck" select all by clicking on other choices
  it("checks off select all if selected is empty, and clicking preserves",
  () => {
    let wrapper = getTagList([]);
    expect(wrapper.prop('specialChoices')![0].selected).to.be.true;
    wrapper.prop('specialChoices')![0].onSelect(true, "click");
    expectCalledWith(onChangeSpy, []);
  });

  it("calls onChange when guest email is toggled on", () => {
    let wrapper = getTagList([guest4.displayName]);
    wrapper.prop('onToggle')({
      original: "Doesn't Matter",
      normalized: normalize(guest1.email)
    }, true, "click");
    expectCalledWith(onChangeSpy, [
      guest4.displayName, guest1.email
    ]);
  });

  it("calls onChange when guest email is toggled off", () => {
    let wrapper = getTagList([guest2.email, guest3.email, guest4.displayName]);
    wrapper.prop('onToggle')({
      original: "Doesn't Matter",
      normalized: normalize(guest3.email)
    }, false, "click");
    expectCalledWith(onChangeSpy, [guest2.email, guest4.displayName]);
  });

  it("calls onChange when guest display name is toggled off", () => {
    let wrapper = getTagList([guest2.email, guest3.email, guest4.displayName]);
    wrapper.prop('onToggle')({
      original: "Doesn't Matter",
      normalized: normalize(guest4.displayName)
    }, false, "click");
    expectCalledWith(onChangeSpy, [guest2.email, guest3.email]);
  });

  it("allows us to add new display names", () => {
    let wrapper = getTagList(["Old Name"]);
    wrapper.prop('onAdd')!("New Name", "enter");
    expectCalledWith(onChangeSpy, ["Old Name", "New Name"]);
  });

  it("submits when dropdown closes", () => {
    let wrapper = getTagList();
    wrapper.prop('onClose')!();
    expect(onSubmitSpy.called).to.be.true;
  });

  it("wraps guests filter function to return choices", () => {
    let wrapper = getTagList();
    let filter = wrapper.prop('filterFn');
    expect(filter("EXAMPLE.com")).to.deep.equal([
      undefined, [guest1Choice, guest2Choice, guest3Choice]
    ]);
    expect(filter("Guest 2")).to.deep.equal([guest2Choice, []]);
    expect(filter("Random")).to.deep.equal([undefined, [guest4Choice]]);
  });
});
