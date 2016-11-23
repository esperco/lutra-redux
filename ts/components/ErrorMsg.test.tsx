import * as React from 'react';
import { expect } from "chai";
import { shallow } from 'enzyme';
import { expectCalledWith } from "../lib/expect-helpers";
import { sandbox } from '../lib/sandbox';

import ErrorMsg from './ErrorMsg';

describe("<ErrorMsg />", () => {
  it("should display nothing if no errors", function() {
    let wrapper = shallow(<ErrorMsg errors={[]} onDismiss={() => null} />);
    expect(wrapper.type()).to.be.null;
  });

  it("should display a .error for each code / detail", function() {
    let wrapper = shallow(<ErrorMsg errors={[
      { code: 500 },
      { code: 400, details: { tag: "Payment_required" }},
      { code: 400, details: { tag: "Wrong_customer_type" }}
    ]} onDismiss={() => null} />);

    let errors = wrapper.find('.error');
    expect(errors).to.have.length(3);

    // Keyed by code or tag
    expect(errors.get(0).key).to.equal("500");
    expect(errors.get(1).key).to.equal("Payment_required");
    expect(errors.get(2).key).to.equal("Wrong_customer_type");
  });

  it("should call onDismiss function when error's action is clicked",
  function() {
    let spy = sandbox.spy();
    let wrapper = shallow(<ErrorMsg errors={[
      { code: 400, details: { tag: "Payment_required" }}
    ]} onDismiss={spy} />);

    let action = wrapper.find(".error").find(".action");
    action.simulate('click');
    expectCalledWith(spy, 400, { tag: "Payment_required" });
  });
});