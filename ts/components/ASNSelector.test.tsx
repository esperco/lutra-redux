import * as React from 'react';
import { expect } from "chai";
import { shallow } from 'enzyme';
import { expectCalledWith } from "../lib/expect-helpers";
import * as Sinon from "sinon";
import { black, offWhite } from "../lib/colors";

import CheckboxItem from "./CheckboxItem";
import ASNSelector from './ASNSelector';

describe("<ASNSelector />", () => {
   // Some default choices for tests below
  let choices = [{
    id: "c1",
    displayAs: <span>Choice 1</span>,
    color: "#EEEEEE",
  }, {
    id: "c2",
    displayAs: <span>Choice 2</span>,
    color: "#123456",
  }];

  it("displays a Checkbox for each choice", () => {
    let wrapper = shallow(<ASNSelector
      choices={choices}
      selected={{ some: { c1: true }}}
      onChange={() => null}
    />);

    let checkboxes = wrapper.find(CheckboxItem);
    expect(checkboxes).to.have.length(2);
    expect(checkboxes.get(0).key).to.equal("choice-c1");
    expect(checkboxes.get(0).props.background).to.equal("#EEEEEE");
    expect(checkboxes.get(0).props.color).to.equal(black);
    expect(checkboxes.get(0).props.checked).to.be.true;
    expect(checkboxes.get(1).key).to.equal("choice-c2");
    expect(checkboxes.get(1).props.background).to.equal("#123456");
    expect(checkboxes.get(1).props.color).to.equal(offWhite);
    expect(checkboxes.get(1).props.checked).to.be.false;
  });

  it("displays a Select All choice if allText is provided", () => {
    let wrapper = shallow(<ASNSelector
      choices={choices}
      selected={{ all: true }}
      onChange={() => null}
      allText="Select All"
    />);

    let checkboxes = wrapper.find(CheckboxItem);
    expect(checkboxes).to.have.length(3);
    expect(checkboxes.get(0).key).to.equal('all');
    expect(checkboxes.get(0).props.children).to.equal("Select All");
  });

  it("checks off all checkboxes if Select All is marked", () => {
    let wrapper = shallow(<ASNSelector
      choices={choices}
      selected={{ all: true }}
      onChange={() => null}
      allText="Select All"
    />);

    let checkboxes = wrapper.find(CheckboxItem);
    expect(checkboxes).to.have.length(3);
    expect(checkboxes.get(0).props.checked).to.be.true;
    expect(checkboxes.get(1).props.checked).to.be.true;
    expect(checkboxes.get(2).props.checked).to.be.true;
  });

  it("displays a Select None choice if noneText is provided", () => {
    let wrapper = shallow(<ASNSelector
      choices={choices}
      selected={{ none: true }}
      onChange={() => null}
      noneText="Select None"
    />);

    let checkboxes = wrapper.find(CheckboxItem);
    expect(checkboxes).to.have.length(3);
    expect(checkboxes.get(2).key).to.equal('none');
    expect(checkboxes.get(2).props.children).to.equal("Select None");
  });

  it("checks off the Select None choice if none is true", () => {
    let wrapper = shallow(<ASNSelector
      choices={choices}
      selected={{ none: true }}
      onChange={() => null}
      noneText="Select None"
    />);

    let checkboxes = wrapper.find(CheckboxItem);
    expect(checkboxes).to.have.length(3);
    expect(checkboxes.get(0).props.checked).to.be.false;
    expect(checkboxes.get(1).props.checked).to.be.false;
    expect(checkboxes.get(2).props.checked).to.be.true;
  });

  it("fires callback in response to clicking choice checkboxes", () => {
    let spy = Sinon.spy();
    let wrapper = shallow(<ASNSelector
      choices={choices}
      selected={{ some: { c1: true } }}
      onChange={spy}
    />);

    let checkboxes = wrapper.find(CheckboxItem);
    expect(checkboxes).to.have.length(2);
    checkboxes.get(0).props.onChange(false);
    expectCalledWith(spy, {});

    spy.reset();
    checkboxes.get(1).props.onChange(true);
    expectCalledWith(spy, { all: true });
  });

  it("fires callback in response to clicking select all", () => {
    let spy = Sinon.spy();
    let wrapper = shallow(<ASNSelector
      choices={choices}
      selected={{ some: { c1: true } }}
      onChange={spy}
      allText="Select All"
    />);

    let checkboxes = wrapper.find(CheckboxItem);
    expect(checkboxes).to.have.length(3);
    checkboxes.get(0).props.onChange(true);
    expectCalledWith(spy, { all: true });
  });

  it("updates state in response to clicking select none", () => {
    let spy = Sinon.spy();
    let wrapper = shallow(<ASNSelector
      choices={choices}
      selected={{ some: { c1: true }, none: true }}
      onChange={spy}
      noneText="Select None"
    />);

    let checkboxes = wrapper.find(CheckboxItem);
    expect(checkboxes).to.have.length(3);
    checkboxes.get(2).props.onChange(false);
    expectCalledWith(spy, { some: { c1: true }});
  });
});
