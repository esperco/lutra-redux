import * as _ from "lodash";
import * as React from 'react';
import { expect } from "chai";
import { shallow } from 'enzyme';
import { expectCalledWith } from "../lib/expect-helpers";
import { simulateInput, simulateEnter } from "../lib/react-test-helpers";
import { stub as stubGlobal } from '../lib/sandbox';
import * as Sinon from "sinon";

import DelayedInput from './DelayedInput';

describe("<DelayedInput />", () => {
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

  it("displays an input box", () => {
    let wrapper = shallow(<DelayedInput value="Init" onUpdate={() => null} />);
    let input = wrapper.find('input');
    expect(input).to.have.length(1);
    expect(input.prop('value')).to.equal('Init');
  });

  it("updates input value when component value changes", () => {
    let wrapper = shallow(<DelayedInput value="Init" onUpdate={() => null} />);
    wrapper.setProps({ value: "New" });
    let input = wrapper.find('input');
    expect(input.prop('value')).to.equal('New');
  });

  it("fires callback on enter", () => {
    let spy = Sinon.spy();
    let wrapper = shallow(<DelayedInput value="Init" onUpdate={spy} />);
    let input = wrapper.find('input');
    simulateEnter(input);
    expectCalledWith(spy, "Init");
  });

  it("sets timer with specified delay after typing", () => {
    let wrapper = shallow(<DelayedInput
      delay={1234}
      value="Init"
      onUpdate={() => null}
    />);
    let input = wrapper.find('input');
    simulateInput(input, "New text");
    expect(timeouts).to.have.length(1);
    expect(timeouts[0].time).to.equal(1234);
  });

  it("clears and resets timer after typing", () => {
    let wrapper = shallow(<DelayedInput
      delay={1234}
      value="Init"
      onUpdate={() => null}
    />);
    let input = wrapper.find('input');
    simulateInput(input, "New text");
    simulateInput(input, "New text!");
    expect(timeouts).to.have.length(2);
    expect(timeouts[0].cleared).to.be.ok;
    expect(timeouts[1].time).to.equal(1234);
    expect(timeouts[1].cleared).to.not.be.ok;
  });

  it("clears timer on unmount", () => {
    let wrapper = shallow(<DelayedInput
      delay={1234}
      value="Init"
      onUpdate={() => null}
    />);
    let input = wrapper.find('input');
    simulateInput(input, "New text");
    wrapper.unmount();
    expect(_.every(timeouts, (t) => t.cleared)).to.be.true;
  });

  it("updates internal value after typing", () => {
    let wrapper = shallow(<DelayedInput
      delay={1234}
      value="Init"
      onUpdate={() => null}
    />);
    let input = wrapper.find('input');
    simulateInput(input, "New text");
    let input2 = wrapper.find('input'); // Reset to get new state changes
    expect(input2.prop('value')).to.equal("New text");
  });

  it("fires callback when timer runs out", () => {
    let spy = Sinon.spy();
    let wrapper = shallow(<DelayedInput value="Init" onUpdate={spy} />);
    let input = wrapper.find('input');
    simulateInput(input, "New text");
    timeouts[0].fn();
    expectCalledWith(spy, "New text");
  });
});