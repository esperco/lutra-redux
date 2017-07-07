import * as React from 'react';
import { expect } from "chai";
import { shallow } from 'enzyme';
import { stubRAF, stubTimeouts } from "../fakes/stubs";
import { expectCalledWith } from "../lib/expect-helpers";
import * as Sinon from "sinon";

import delay from './DelayedControl';
import TextInput from './TextInput';

describe("delay", () => {
  var timeouts: {
    fn: Function;
    time: number;
    cleared?: boolean;
  }[] = [];
  var rAFStub: Sinon.SinonStub;

  beforeEach(() => {
    timeouts = stubTimeouts();
    rAFStub = stubRAF();
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

  it("updates input value when prop value changes", () => {
    let wrapper = shallow(getInput());
    wrapper.setProps({ value: "New" } as any);
    wrapper.update();
    let input = wrapper.find(TextInput);
    expect(input.prop('value')).to.equal('New');
  });

  it("does not update input value when prop value changes if pending timeout",
  () => {
    let wrapper = shallow(getInput());
    let input = wrapper.find(TextInput);
    input.prop('onChange')("User text");

    wrapper.setProps({ value: "New" } as any);
    wrapper.update();
    input = wrapper.find(TextInput);
    expect(input.prop('value')).to.equal('User text');
  });

  it("fires callback when onSubmit received", () => {
    let spy = Sinon.spy();
    let wrapper = shallow(getInput(spy));
    let input = wrapper.find(TextInput);
    input.prop('onSubmit')!();
    expect(rAFStub.called).to.be.true;
    rAFStub.getCall(0).args[0]();
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
    expect(timeouts.every((t) => !!t.cleared)).to.be.true;
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