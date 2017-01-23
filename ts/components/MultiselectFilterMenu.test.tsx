import * as _ from 'lodash';
import * as React from 'react';
import { expect } from "chai";
import { shallow } from 'enzyme';
import * as Sinon from 'sinon';
import { expectCalledWith } from "../lib/expect-helpers";
import CheckboxItem from "./CheckboxItem";
import FilterInput from "./FilterInput";
import { Choice } from "./Menu";
import MultiselectFilterMenu from "./MultiselectFilterMenu";
import { OrderedSet } from "../lib/util";

describe("<MultiselectFilterMenu />", () => {
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

  // Custom norm function for testing -- ignores all non-alpha chars
  function norm(s: string) {
    return s.replace(/[^a-zA-Z]+/g, "");
  }

  class TestSet extends OrderedSet<Choice> {
    constructor(choices: Choice[]) {
      super(choices, (c) => norm(c.normalized));
    }
  }

  const choices = new TestSet([choice1, choice2, choice3]);
  const selected = new TestSet([choice1, choice2]);
  const partial = new TestSet([choice2]);
  var addSpy: Sinon.SinonSpy;
  var toggleSpy: Sinon.SinonSpy;

  function filter(choices: OrderedSet<Choice>, s: string) {
    s = norm(s);
    let filtered = choices.filter((c) => _.includes(c.normalized, s));
    let match = choices.getByKey(s);
    if (match) {
      filtered.pull(match);
    }
    return [match, filtered.toList()] as [Choice|undefined, Choice[]];
  }

  function getMenu() {
    addSpy = Sinon.spy();
    toggleSpy = Sinon.spy();
    return shallow(<MultiselectFilterMenu
      choices={choices}
      selectedChoices={selected}
      partial={partial}
      filterFn={(str) => filter(choices, str)}
      onAdd={addSpy}
      onToggle={toggleSpy}
    />);
  }

  it("displays all choices by default", () => {
    let checkboxes = getMenu().find(CheckboxItem);
    expect(checkboxes).to.have.length(3);
  });

  it("checks selected choices", () => {
    let checkboxes = getMenu().find(CheckboxItem);
    expect(checkboxes.at(0).prop('checked')).to.be.true;
    expect(checkboxes.at(1).prop('checked')).to.be.true;
    expect(checkboxes.at(2).prop('checked')).to.be.false;
  });

  it("calls onToggle with true if we check an unselected box", () => {
    let checkboxes = getMenu().find(CheckboxItem);
    checkboxes.at(2).prop('onChange')(true);
    expectCalledWith(toggleSpy, choice3, true, 'click')
  });

  it("calls onToggle with false if we check a selected box", () => {
    let checkboxes = getMenu().find(CheckboxItem);
    checkboxes.at(0).prop('onChange')(false);
    expectCalledWith(toggleSpy, choice1, false, 'click')
  });

  it("applies a 'partial' class to partially selected items", () => {
    let checkboxes = getMenu().find(CheckboxItem);
    expect(checkboxes.at(0).hasClass("partial")).to.be.false;
    expect(checkboxes.at(1).hasClass("partial")).to.be.true;
    expect(checkboxes.at(2).hasClass("partial")).to.be.false;
  });

  it("calls onToggle with true if we check a partially selected box", () => {
    let checkboxes = getMenu().find(CheckboxItem);
    checkboxes.at(1).prop('onChange')(false);
    expectCalledWith(toggleSpy, choice2, true, 'click')
  });

  it("allows highlighting with arrow keys", () => {
    let wrapper = getMenu();
    let input = wrapper.find(FilterInput);
    input.prop('onDown')();
    wrapper.update();
    expect(wrapper.find(CheckboxItem).first().hasClass('active')).to.be.true;
  });

  it("allows us to unhighlight by going up and permits rehighlighting after",
  () => {
    let wrapper = getMenu();
    let input = wrapper.find(FilterInput);
    input.prop('onDown')();
    input.prop('onUp')();
    wrapper.update();
    expect(wrapper.find(CheckboxItem).first().hasClass('active')).to.be.false;
  });

  describe("after typing", () => {
    function getMenuAfterTyping(text: string) {
      let wrapper = getMenu();
      let input = wrapper.find(FilterInput);
      input.prop('onChange')(text);
      wrapper.update();
      return wrapper;
    }

    it("filters based on substring", () => {
      let checkboxes = getMenuAfterTyping("ellow 3").find(CheckboxItem);
      expect(checkboxes).to.have.length(2); // New item
      expect(checkboxes.at(0).dive(1).text()).to.equal("Yellow Green");
      expect(checkboxes.at(1).dive(1).text()).to.equal("Mellow Yellow");
    });

    it("includes a button to add new item", () => {
      let button = getMenuAfterTyping("ellow 3").find('button');
      expect(button).to.have.length(1);
    });

    it("includes a button that calls onAdd when clicked", () => {
      let button = getMenuAfterTyping("ellow 3").find('button');
      button.simulate('click');
      expectCalledWith(addSpy, "ellow 3", "click");
    });

    it("highlights button by default if visible", () => {
      let wrapper = getMenuAfterTyping("ellow 3")
      expect(wrapper.find('button').hasClass('active')).to.be.true;
    });

    it("calls onAdd if we submit when button is highlighted", () => {
      let wrapper = getMenuAfterTyping("ellow 3")
      let input = wrapper.find(FilterInput);
      input.prop('onSubmit')();
      expectCalledWith(addSpy, "ellow 3", "enter");
    });

    it("does not include the onAdd button if exact match", () => {
      let button = getMenuAfterTyping("yellow green").find('button');
      expect(button).to.have.length(0);
    });

    it("allows highlighting checkboxes with arrow keys", () => {
      let wrapper = getMenuAfterTyping("ellow 3")
      let input = wrapper.find(FilterInput);
      input.prop('onDown')();
      wrapper.update();
      expect(wrapper.find('button').hasClass('active')).to.be.false;
      expect(wrapper.find(CheckboxItem).first().hasClass('active')).to.be.true;
    });

    it("calls onToggle when we submit when a checkbox is highlighted", () => {
      let wrapper = getMenuAfterTyping("ellow 3")
      let input = wrapper.find(FilterInput);
      input.prop('onDown')();
      input.prop('onSubmit')();
      expectCalledWith(toggleSpy, choice1, false, "enter");
    });

    it("does not go past the end of the filtered list when using arrows",
    () => {
      let wrapper = getMenuAfterTyping("ellow 3")
      let input = wrapper.find(FilterInput);
      input.prop('onDown')();
      input.prop('onDown')();
      input.prop('onDown')();
      input.prop('onDown')();
      input.prop('onDown')();
      wrapper.update();
      expect(wrapper.find(CheckboxItem).last().hasClass('active')).to.be.true;
    });

    it("does not allow us to go past begining if new item button is visible",
    () => {
      let wrapper = getMenuAfterTyping("ellow 3")
      let input = wrapper.find(FilterInput);
      input.prop('onDown')();
      input.prop('onUp')();
      input.prop('onUp')();
      wrapper.update();
      expect(wrapper.find('button').hasClass('active')).to.be.true;
    });
  });

  describe("with special choices", () => {
    var special1Spy: Sinon.SinonSpy;
    var special2Spy: Sinon.SinonSpy;

    function getMenu() {
      addSpy = Sinon.spy();
      toggleSpy = Sinon.spy();
      special1Spy = Sinon.spy();
      special2Spy = Sinon.spy();
      return shallow(<MultiselectFilterMenu
        choices={choices}
        selectedChoices={selected}
        partial={partial}
        filterFn={(str) => filter(choices, str)}
        onAdd={addSpy}
        onToggle={toggleSpy}
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
      let checkboxes = getMenu().find(CheckboxItem);
      expect(checkboxes).to.have.length(5);
      expect(checkboxes.at(0).dive(1).text()).to.equal("Special Choice 1");
      expect(checkboxes.at(1).dive(1).text()).to.equal("Special Choice 2");
    });

    it("passes on selected status to checkbox for special choice", () => {
      let checkboxes = getMenu().find(CheckboxItem);
      expect(checkboxes.at(0).prop('checked')).to.be.true;
      expect(checkboxes.at(1).prop('checked')).to.be.false;
    });

    it("triggers callback when special choice is clicked", () => {
      let checkboxes = getMenu().find(CheckboxItem);
      checkboxes.at(1).prop('onChange')(true);
      expectCalledWith(special2Spy, true, "click");
    });

    it("allows highlighting and submitting a special choice", () => {
      let wrapper = getMenu();
      let input = wrapper.find(FilterInput);
      input.prop('onDown')();
      wrapper.update();
      expect(wrapper.find(CheckboxItem).at(0).hasClass('active')).to.be.true;

      input.prop('onSubmit')()
      expectCalledWith(special1Spy, false, "enter");
    });

    it("allows us to select a regular choice with an arrow key and " +
       "toggle", () => {
      let wrapper = getMenu();
      let input = wrapper.find(FilterInput);
      input.prop('onDown')();
      wrapper.update();
      expect(wrapper.find(CheckboxItem).at(0).hasClass('active')).to.be.true;

      input.prop('onSubmit')()
      expectCalledWith(special1Spy, false, "enter");
    });

    describe("after typing", () => {
      function getMenuAfterTyping(text: string) {
        let wrapper = getMenu();
        let input = wrapper.find(FilterInput);
        input.prop('onChange')(text);
        wrapper.update();
        return wrapper;
      }

      it("hides special choices", () => {
        let wrapper = getMenuAfterTyping("green");
        let checkboxes = wrapper.find(CheckboxItem);
        expect(checkboxes).to.have.length(2);
      });
    });
  });
});
