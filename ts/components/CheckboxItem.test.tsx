import * as React from 'react';
import { expect } from "chai";
import { shallow } from 'enzyme';
import { expectCalledWith } from "../lib/expect-helpers";
import * as Sinon from "sinon";

import CheckboxItem from './CheckboxItem';

describe("<CheckboxItem />", () => {
  it("renders a checkbox", () => {
    let wrapper = shallow(<CheckboxItem onChange={() => null} />);
    let checkbox = wrapper.find('input[type="checkbox"]');
    expect(checkbox).to.have.length(1);
  });

  it("renders children inside label", () => {
    let wrapper = shallow(<CheckboxItem onChange={() => null}>
      <span id="id123">Hello World</span>
    </CheckboxItem>);
    expect(wrapper.is('label')).to.be.true;
    expect(wrapper.find('#id123').text()).equals('Hello World');
    wrapper.unmount();
  });

  it("sets defaultChecked by default", () => {
    let wrapper = shallow(<CheckboxItem onChange={() => null} />);
    let checkbox = wrapper.find('input[type="checkbox"]');
    expect(checkbox.prop('defaultChecked')).to.be.false;
    expect(checkbox.prop('checked')).to.be.undefined;
  });

  it("sets checked if specified", () => {
    let wrapper = shallow(
      <CheckboxItem checked={false} onChange={() => null} />
    );
    let checkbox = wrapper.find('input[type="checkbox"]');
    expect(checkbox.prop('defaultChecked')).to.be.undefined;
    expect(checkbox.prop('checked')).to.be.false;
  });

  it("fires onChange event with boolean indicating checked state " +
     "with defaultChecked", () => {
    let spy = Sinon.spy();
    let wrapper = shallow(<CheckboxItem onChange={spy} />);
    let checkbox = wrapper.find('input[type="checkbox"]');
    checkbox.simulate('change', { target: { checked: true }});
    expectCalledWith(spy, true);
  });

  it("fires onChange event with boolean indicating checked state " +
     "with checked", () => {
    let spy = Sinon.spy();
    let wrapper = shallow(<CheckboxItem checked={true} onChange={spy} />);
    let checkbox = wrapper.find('input[type="checkbox"]');
    checkbox.simulate('change', { target: { checked: false }});
    expectCalledWith(spy, false);
  });
});