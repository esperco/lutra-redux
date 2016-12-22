import * as _ from "lodash";
import * as React from 'react';
import { expect } from "chai";
import { shallow } from 'enzyme';
import { expectCalledWith } from "../lib/expect-helpers";
import { stub as stubGlobal } from '../lib/sandbox';
import * as Sinon from "sinon";

import delay from './DelayedControl';
import TextInput from './TextInput';

describe("delay", () => {
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

  function getInput(onChange = (x: string) => null, delayNum?: number) {
    return delay({
      value: "Init",
      delay: delayNum,
      onChange,
      component: (props) => <TextInput { ...props} />
    });
  }

  it("displays the rendered component", () => {
    let wrapper = shallow(getInput());
    let input = wrapper.find(TextInput);
    expect(input).to.have.length(1);
    expect(input.prop('value')).to.equal('Init');
  });

  it("updates input value when component value changes", () => {
    let wrapper = shallow(getInput());
    wrapper.setProps({ value: "New" } as any);
    let input = wrapper.find(TextInput);
    expect(input).to.have.length(1);
    expect(input.prop('value')).to.equal('Init');
  });

  it("fires callback when onSubmit received", () => {
    let spy = Sinon.spy();
    let wrapper = shallow(getInput(spy));
    let input = wrapper.find(TextInput);
    input.prop('onSubmit')();
    expectCalledWith(spy, "Init");
  });

  it("sets timer with specified delay after change", () => {
    let spy = Sinon.spy();
    let wrapper = shallow(getInput(spy, 1234));
    let input = wrapper.find(TextInput);
    input.prop('onChange')("New text");
    expect(timeouts).to.have.length(1);
    expect(timeouts[0].time).to.equal(1234);
    expect(spy.called).to.be.false;
  });

  it("clears and resets timer after change", () => {
    let spy = Sinon.spy();
    let wrapper = shallow(getInput(spy, 1234));
    let input = wrapper.find(TextInput);
    input.prop('onChange')("New text");
    input.prop('onChange')("New text!");
    expect(timeouts).to.have.length(2);
    expect(timeouts[0].cleared).to.be.ok;
    expect(timeouts[1].time).to.equal(1234);
    expect(timeouts[1].cleared).to.not.be.ok;
    expect(spy.called).to.be.false;
  });

  it("clears timer on unmount", () => {
    let wrapper = shallow(getInput());
    let input = wrapper.find(TextInput);
    input.prop('onChange')("New text");
    wrapper.unmount();
    expect(_.every(timeouts, (t) => t.cleared)).to.be.true;
  });

  it("fires callback when timer runs out", () => {
    let spy = Sinon.spy();
    let wrapper = shallow(getInput(spy));
    let input = wrapper.find(TextInput);
    input.prop('onChange')("New text");
    timeouts[0].fn();
    expectCalledWith(spy, "New text");
  });
});