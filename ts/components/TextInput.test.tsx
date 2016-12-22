import * as React from 'react';
import { expect } from "chai";
import { shallow } from 'enzyme';
import { expectCalledWith } from "../lib/expect-helpers";
import { simulateInput, simulateEnter } from "../lib/react-test-helpers";
import * as Sinon from "sinon";

import TextInput from './TextInput';

describe("<TextInput />", () => {
  it("displays an input box", () => {
    let wrapper = shallow(<TextInput value="Init" onChange={() => null} />);
    let input = wrapper.find('input');
    expect(input).to.have.length(1);
    expect(input.prop('value')).to.equal('Init');
  });

  it("updates input value when component value changes", () => {
    let wrapper = shallow(<TextInput value="Init" onChange={() => null} />);
    wrapper.setProps({ value: "New" });
    let input = wrapper.find('input');
    expect(input.prop('value')).to.equal('New');
  });

  it("fires callback on enter", () => {
    let spy = Sinon.spy();
    let wrapper = shallow(<TextInput
      value="Init"
      onChange={() => null}
      onSubmit={spy}
    />);
    let input = wrapper.find('input');
    simulateEnter(input);
    expect(spy.called).to.be.true;
  });

  it("fires callback after typing", () => {
    let spy = Sinon.spy();
    let wrapper = shallow(<TextInput
      value="Init"
      onChange={spy}
    />);
    let input = wrapper.find('input');
    simulateInput(input, "New text");
    expectCalledWith(spy, "New text");
  });
});