import * as React from "react";
import { expect } from "chai";
import { shallow } from "enzyme";
import * as Sinon from "sinon";
import { expectCalledWith } from "../lib/expect-helpers";
import StarRating from "./StarRating";

describe("<StarRating />", () => {
  it("renders maxStars buttons -- one for each star", () => {
    let wrapper = shallow(<StarRating
      onChange={() => null}
      maxStars={3}
    />);
    let buttons = wrapper.find("button");
    expect(buttons).to.have.length(3);
    expect(buttons.at(0).text()).to.equal("\u2606");
    expect(buttons.at(1).text()).to.equal("\u2606");
    expect(buttons.at(2).text()).to.equal("\u2606");
  });

  it("changes star appearance based on value", () => {
    let wrapper = shallow(<StarRating
      onChange={() => null}
      value={2}
      maxStars={3}
    />);
    expect(wrapper.text()).to.equal("\u2605\u2605\u2606");
  });

  it("calls onChange when button is clicked", () => {
    let spy = Sinon.spy();
    let wrapper = shallow(<StarRating
      onChange={spy}
      value={1}
      maxStars={3}
    />);
    let buttons = wrapper.find("button");
    buttons.at(1).simulate('click');
    expectCalledWith(spy, 2);
  });
});