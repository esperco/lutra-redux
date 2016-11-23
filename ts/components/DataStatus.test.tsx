import * as React from 'react';
import { expect } from "chai";
import { shallow } from 'enzyme';

import DataStatus from './DataStatus';
import { Loading, Saving } from "../text/data-status";

describe("<DataStatus />", () => {
  it("should display nothing if no apiCalls", () => {
    let wrapper = shallow(<DataStatus apiCalls={{}} />);
    expect(wrapper.type()).to.be.null;
  });

  it("should only display Loading element if all apiCalls are false", () => {
    let wrapper = shallow(<DataStatus apiCalls={{
      someApiId: false
    }} />);

    expect(wrapper.contains(Loading)).to.be.true;
    expect(wrapper.contains(Saving)).to.be.false;
  });

  it("should only display Saving element if any apiCalls are true", () => {
    let wrapper = shallow(<DataStatus apiCalls={{
      someApiId: false,
      otherApiId: true
    }} />);

    expect(wrapper.contains(Saving)).to.be.true;
    expect(wrapper.contains(Loading)).to.be.false;
  });
});