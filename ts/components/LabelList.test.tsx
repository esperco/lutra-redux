import * as React from 'react';
import { expect } from "chai";
import { mount } from 'enzyme';
import CheckboxItem from "./CheckboxItem";
import Dropdown from "./Dropdown";
import FilterInput from "./FilterInput";
import FilterMenu from "./FilterMenu";
import LabelList from "./LabelList";
import makeEvent from "../fakes/events-fake";
import { testLabel } from "../fakes/labels-fake";
import { LabelSet } from "../lib/event-labels";

describe("<LabelList />", () => {
  const label1 = testLabel("Wine and Cheese");
  const label2 = testLabel("Coffee and Donuts");
  const label3 = testLabel("Cheese and Grits");
  const event1 = makeEvent({
    id: "e1",
    labels: [label1]
  });
  const event2 = makeEvent({
    id: "e2",
    labels: [label1]
  });
  const baseLabels = new LabelSet([label1, label2]);
  const searchLabels = new LabelSet([label2, label3]);

  function getLabelList() {
    return mount(<LabelList
      labels={baseLabels}
      searchLabels={searchLabels}
      events={[event1, event2]}
      onChange={() => null}
    />);
  }

  function getMenu() {
    let wrapper = getLabelList();
    let dropdown = wrapper.find(Dropdown);
    return mount(dropdown.prop('menu'));
  }

  it("displays selected labels in TagList", () => {
    let wrapper = getLabelList();
    expect(wrapper.find(".tag")).to.have.length(1);
  })

  it("renders a FilterMenu inside a dropdown", () => {
    expect(getMenu().find(FilterMenu)).to.have.length(1);
  });

  it("displays labels in FilterMenu by default", () => {
    let menu = getMenu();
    let checkboxes = menu.find(CheckboxItem);
    expect(checkboxes).to.have.length(2);
    expect(checkboxes.at(0).text()).to.equal(label1.original);
    expect(checkboxes.at(1).text()).to.equal(label2.original);
  });

  it("searches searchLabels in FilterMenu", () => {
    let menu = getMenu();
    let input = menu.find(FilterInput);
    input.prop('onChange')("Cheese");
    menu.update();

    let checkboxes = menu.find(CheckboxItem);
    expect(checkboxes).to.have.length(1);
    expect(checkboxes.at(0).text()).to.equal(label3.original);
  });
});