import * as React from 'react';
import { expect } from "chai";
import { shallow } from 'enzyme';
import { expectCalledWith } from "../lib/expect-helpers";
import * as Sinon from "sinon";

import RadioItem from './RadioItem';

describe("<RadioItem />", () => {
  it("renders a radio button", () => {
    let wrapper = shallow(<RadioItem name="test" onChange={() => null} />);
    let radio = wrapper.find('input[type="radio"]');
    expect(radio).to.have.length(1);
    expect(radio.prop("name")).to.equal("test");
  });

  it("renders children inside label", () => {
    let wrapper = shallow(<RadioItem name="test" onChange={() => null}>
      <span id="test-123">Hello World</span>
    </RadioItem>);
    expect(wrapper.is('label')).to.be.true;
    expect(wrapper.find('#test-123').text()).equals('Hello World');
  });

  it("sets defaultChecked by default", () => {
    let wrapper = shallow(<RadioItem name="test" onChange={() => null} />);
    let radio = wrapper.find('input[type="radio"]');
    expect(radio.prop('defaultChecked')).to.be.false;
    expect(radio.prop('checked')).to.be.undefined;
  });

  it("sets checked if specified", () => {
    let wrapper = shallow(
      <RadioItem name="test" checked={false} onChange={() => null} />
    );
    let radio = wrapper.find('input[type="radio"]');
    expect(radio.prop('defaultChecked')).to.be.undefined;
    expect(radio.prop('checked')).to.be.false;
  });

  it("fires onChange event with boolean indicating checked state " +
     "with defaultChecked", () => {
    let spy = Sinon.spy();
    let wrapper = shallow(<RadioItem name="test" onChange={spy} />);
    let radio = wrapper.find('input[type="radio"]');
    radio.simulate('change', { target: { checked: true } });
    expectCalledWith(spy, true);
  });

  it("fires onChange event with boolean indicating checked state " +
     "with checked", () => {
    let spy = Sinon.spy();
    let wrapper = shallow(
      <RadioItem name="test" checked={true} onChange={spy} />
    );
    let radio = wrapper.find('input[type="radio"]');
    radio.simulate('change', { target: { checked: false } });
    expectCalledWith(spy, false);
  });
});