import * as React from 'react';
import { expect } from "chai";
import { shallow } from 'enzyme';
import * as Sinon from 'sinon';
import { expectCalledWith } from "../lib/expect-helpers";
import RadioItem from "./RadioItem";
import FilterInput from "./FilterInput";
import FilterMenu from "./FilterMenu";
import { OrderedSet } from "../lib/util";

/*
  See MultiselectFilterMenu.test.tsx for other tests
*/

describe("<FilterMenu />", () => {
  const choice1 = {
    original: "Yellow Green",
    normalized: "yellow green"
  };
  const choice2 = {
    original: "Mellow Yellow",
    normalized: "mellow yellow"
  };
  const choice3 = {
    original: "Green Tea",
    normalized: "green tea"
  };

  const choices = new OrderedSet([choice1, choice2, choice3]);
  const selected = choice2;
  var addSpy: Sinon.SinonSpy;
  var selectSpy: Sinon.SinonSpy;

  function getMenu() {
    addSpy = Sinon.spy();
    selectSpy = Sinon.spy();
    return shallow(<FilterMenu
      choices={choices}
      selected={selected}
      filterFn={(str) => [undefined, []]}
      onAdd={addSpy}
      onSelect={selectSpy}
    />);
  }

  it("displays all choices by default", () => {
    let radios = getMenu().find(RadioItem);
    expect(radios).to.have.length(3);
  });

  it("checks selected choice", () => {
    let radios = getMenu().find(RadioItem);
    expect(radios.at(0).prop('checked')).to.be.false;
    expect(radios.at(1).prop('checked')).to.be.true;
    expect(radios.at(2).prop('checked')).to.be.false;
  });

  it("calls onSelect with true if we check that item", () => {
    let checkboxes = getMenu().find(RadioItem);
    checkboxes.at(2).prop('onChange')(true);
    expectCalledWith(selectSpy, choice3, 'click')
  });

  it("allows highlighting with arrow keys", () => {
    let wrapper = getMenu();
    let input = wrapper.find(FilterInput);
    input.prop('onDown')!();
    wrapper.update();
    expect(wrapper.find(RadioItem).first().hasClass('active')).to.be.true;
  });

  describe("with special choices", () => {
    var special1Spy: Sinon.SinonSpy;
    var special2Spy: Sinon.SinonSpy;

    function getMenu() {
      addSpy = Sinon.spy();
      selectSpy = Sinon.spy();
      special1Spy = Sinon.spy();
      special2Spy = Sinon.spy();
      return shallow(<FilterMenu
        choices={choices}
        selected={selected}
        filterFn={(str) => [undefined, []]}
        onAdd={addSpy}
        onSelect={selectSpy}
        specialChoices={[{
          displayAs: "Special Choice 1",
          selected: true,
          onSelect: special1Spy
        }, {
          displayAs: "Special Choice 2",
          selected: false,
          onSelect: special2Spy
        }]}
      />);
    }

    it("displays special choices", () => {
      let radios = getMenu().find(RadioItem);
      expect(radios).to.have.length(5);
      expect(radios.at(0).dive().text()).to.equal("Special Choice 1");
      expect(radios.at(1).dive().text()).to.equal("Special Choice 2");
    });

    it("passes on selected status to checkbox for special choice", () => {
      let radios = getMenu().find(RadioItem);
      expect(radios.at(0).prop('checked')).to.be.true;
      expect(radios.at(1).prop('checked')).to.be.false;
    });

    it("triggers callback when special choice is clicked", () => {
      let checkboxes = getMenu().find(RadioItem);
      checkboxes.at(1).prop('onChange')(true);
      expectCalledWith(special2Spy, true, "click");
    });
  });
});
