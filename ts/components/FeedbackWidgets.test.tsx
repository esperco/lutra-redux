import * as React from "react";
import { expect } from "chai";
import { shallow, mount } from "enzyme";
import * as Sinon from "sinon";
import CheckboxItem from "../components/CheckboxItem";
import { DelayedControl } from "../components/DelayedControl";
import { expectCalledWith } from "../lib/expect-helpers";
import FeedbackWidgets from "./FeedbackWidgets";

describe("<FeedbackWidgets />", () => {
  it("does not render textbox if no stars", () => {
    let wrapper = shallow(<FeedbackWidgets
      onChange={() => null}
      value={{ }}
    />);
    expect(wrapper.find(DelayedControl)).to.have.length(0);
  });

  it("does render textbox if some stars", () => {
    let wrapper = shallow(<FeedbackWidgets
      onChange={() => null}
      value={{ stars: 3 }}
    />);
    expect(wrapper.find(DelayedControl)).to.have.length(1);
  });

  it("calls onChange with notes via textbox after delayed textarea onChange",
  () => {
    let spy = Sinon.spy();
    let wrapper = shallow(<FeedbackWidgets
      onChange={spy}
      value={{ stars: 3 }}
    />);
    let cb = wrapper.find(DelayedControl).prop('onChange') as any;
    cb(" hello ");
    expectCalledWith(spy, { notes: "hello" });
  });

  it("allows retrieval of notes via getVal", () => {
    let spy = Sinon.spy();
    let wrapper = mount(<FeedbackWidgets
      onChange={spy}
      value={{ stars: 3, notes: "Test  " }}
    />);
    let instance = wrapper.instance() as FeedbackWidgets;
    expect(instance.getVal()).to.deep.equal({ notes: "Test" });
  });

  it("renders checkboxes for didnt_attend and is_organizer", () => {
    let spy = Sinon.spy();
    let wrapper = shallow(<FeedbackWidgets
      onChange={spy}
      value={{ didnt_attend: true }}
    />);
    let checkboxes = wrapper.find(CheckboxItem);
    expect(checkboxes).to.have.length(2);

    let cb0 = checkboxes.at(0);
    cb0.prop('onChange')(!cb0.prop('checked'));
    let cb1 = checkboxes.at(1);
    cb1.prop('onChange')(!cb1.prop('checked'));

    expectCalledWith(spy, { didnt_attend: false });
    expectCalledWith(spy, { is_organizer: true });
  });
});