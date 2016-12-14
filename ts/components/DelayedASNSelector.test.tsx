import * as React from 'react';
import { expect } from "chai";
import { shallow } from 'enzyme';
import { expectCalledWith } from "../lib/expect-helpers";
import { stub as stubGlobal } from '../lib/sandbox';
import * as Sinon from "sinon";
import { black, offWhite } from "../lib/colors";

import CheckboxItem from "./CheckboxItem";
import DelayedASNSelector from './DelayedASNSelector';

describe("<DelayedASNSelector />", () => {
  var timeouts: {
    fn: Function;
    time: number;
    cleared?: boolean;
  }[] = [];
  var setTimeoutStub: Sinon.SinonStub;
  var clearTimeoutStub: Sinon.SinonStub;

  beforeEach(() => {
    timeouts = [];

    setTimeoutStub = stubGlobal("setTimeout",
      (fn: Function, time: number) => {
        let n = timeouts.length;
        timeouts.push({ fn, time });
        return n;
      });

    clearTimeoutStub = stubGlobal("clearTimeout", (n: number) => {
      let t = timeouts[n];
      if (t) {
        t.cleared = true;
      }
    });
  });

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
    let wrapper = shallow(<DelayedASNSelector
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
    let wrapper = shallow(<DelayedASNSelector
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
    let wrapper = shallow(<DelayedASNSelector
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
    let wrapper = shallow(<DelayedASNSelector
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
    let wrapper = shallow(<DelayedASNSelector
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

  it("updates choices after receiving props", () => {
    let wrapper = shallow(<DelayedASNSelector
      choices={choices}
      selected={{ none: true }}
      onChange={() => null}
    />);
    wrapper.setProps({ selected: { some: { c1: true } } });
    let checkboxes = wrapper.find(CheckboxItem);
    expect(checkboxes).to.have.length(2);
    expect(checkboxes.get(0).props.checked).to.be.true;
    expect(checkboxes.get(1).props.checked).to.be.false;
  });

  it("updates state in response to clicking choice checkboxes", () => {
    let wrapper = shallow(<DelayedASNSelector
      choices={choices}
      selected={{ some: { c1: true } }}
      onChange={() => null}
    />);

    let checkboxes = wrapper.find(CheckboxItem);
    expect(checkboxes).to.have.length(2);
    checkboxes.get(0).props.onChange(false);
    checkboxes.get(1).props.onChange(true);

    wrapper.update();
    checkboxes = wrapper.find(CheckboxItem);
    expect(checkboxes.get(0).props.checked).to.be.false;
    expect(checkboxes.get(1).props.checked).to.be.true;
  });

  it("updates state in response to clicking select all", () => {
    let wrapper = shallow(<DelayedASNSelector
      choices={choices}
      selected={{ some: { c1: true } }}
      onChange={() => null}
      allText="Select All"
    />);

    let checkboxes = wrapper.find(CheckboxItem);
    expect(checkboxes).to.have.length(3);
    checkboxes.get(0).props.onChange(true);

    wrapper.update();
    checkboxes = wrapper.find(CheckboxItem);
    expect(checkboxes.get(0).props.checked).to.be.true;
    expect(checkboxes.get(1).props.checked).to.be.true;
    expect(checkboxes.get(2).props.checked).to.be.true;
  });

  it("updates state in response to clicking select none", () => {
    let wrapper = shallow(<DelayedASNSelector
      choices={choices}
      selected={{ none: true }}
      onChange={() => null}
      noneText="Select None"
    />);

    let checkboxes = wrapper.find(CheckboxItem);
    expect(checkboxes).to.have.length(3);
    checkboxes.get(2).props.onChange(false);

    wrapper.update();
    checkboxes = wrapper.find(CheckboxItem);
    expect(checkboxes.get(0).props.checked).to.be.false;
    expect(checkboxes.get(1).props.checked).to.be.false;
    expect(checkboxes.get(2).props.checked).to.be.false;
  });

  it("sets timer with specified delay after selection", () => {
    let wrapper = shallow(<DelayedASNSelector
      delay={1234}
      choices={choices}
      selected={{ all: true }}
      onChange={() => null}
      allText="Select All"
      noneText="Select None"
    />);

    let checkboxes = wrapper.find(CheckboxItem);
    expect(checkboxes).to.have.length(4);
    checkboxes.get(0).props.onChange(false);

    expect(timeouts).to.have.length(1);
    expect(timeouts[0].time).to.equal(1234);
  });

  it("clears and sets new timer after each selection", () => {
    let wrapper = shallow(<DelayedASNSelector
      delay={1234}
      choices={choices}
      selected={{ all: true }}
      onChange={() => null}
      allText="Select All"
      noneText="Select None"
    />);

    let checkboxes = wrapper.find(CheckboxItem);
    expect(checkboxes).to.have.length(4);
    checkboxes.get(0).props.onChange(false);
    checkboxes.get(1).props.onChange(true);

    expect(timeouts).to.have.length(2);
    expect(timeouts[0].cleared).to.be.true;
    expect(timeouts[1].cleared).to.not.be.true;
    expect(timeouts[1].time).to.equal(1234);
  });

  it("calls onChange with new AllSomeNone after timeout", () => {
    let spy = Sinon.spy();
    let wrapper = shallow(<DelayedASNSelector
      delay={1234}
      choices={choices}
      selected={{ all: true }}
      onChange={spy}
      allText="Select All"
      noneText="Select None"
    />);

    let checkboxes = wrapper.find(CheckboxItem);
    expect(checkboxes).to.have.length(4);
    checkboxes.get(0).props.onChange(false);
    checkboxes.get(1).props.onChange(true);
    checkboxes.get(3).props.onChange(true);

    expect(timeouts).to.have.length(3);
    timeouts[2].fn();
    expectCalledWith(spy, {
      some: { c1: true },
      none: true
    });
  });

  it("only calls onChange if new result is different from old", () => {
    let spy = Sinon.spy();
    let wrapper = shallow(<DelayedASNSelector
      delay={1234}
      choices={choices}
      selected={{ all: true }}
      onChange={spy}
      allText="Select All"
      noneText="Select None"
    />);

    let checkboxes = wrapper.find(CheckboxItem);
    expect(checkboxes).to.have.length(4);
    checkboxes.get(0).props.onChange(false);
    checkboxes.get(0).props.onChange(true);

    expect(timeouts).to.have.length(2);
    timeouts[1].fn();
    expect(spy.called).to.be.false;
  });
});
