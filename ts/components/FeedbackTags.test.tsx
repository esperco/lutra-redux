import * as React from "react";
import { expect } from "chai";
import { shallow, mount } from "enzyme";
import * as Sinon from "sinon";
import { expectCalledWith } from "../lib/expect-helpers";
import FeedbackTags from "./FeedbackTags";

describe("<FeedbackTags />", () => {
  it("renders nothing if no stars", () => {
    let wrapper = shallow(<FeedbackTags
      onChange={() => null}
      value={{ }}
    />);
    expect(wrapper.type()).to.be.null;
  });

  it("renders positive buttons if 5 stars", () => {
    let spy = Sinon.spy();
    let wrapper = mount(<FeedbackTags
      onChange={spy}
      value={{ stars: 5 }}
    />);
    let buttons = wrapper.find('button');
    expect(buttons).to.have.length(5);
    buttons.at(0).simulate('click');
    buttons.at(1).simulate('click');
    buttons.at(2).simulate('click');
    buttons.at(3).simulate('click');
    buttons.at(4).simulate('click');

    expectCalledWith(spy, { agenda: true });
    expectCalledWith(spy, { on_time: true });
    expectCalledWith(spy, { good_time_mgmt: true });
    expectCalledWith(spy, { contributed: true });
    expectCalledWith(spy, { action_items: true });
  });

  it("renders existing positive feedback and allows unsetting", () => {
    let spy = Sinon.spy();
    let wrapper = mount(<FeedbackTags
      onChange={spy}
      value={{ stars: 5, agenda: true }}
    />);
    let buttons = wrapper.find('button');
    let agendaBtn = buttons.at(0);
    let otherBtn = buttons.at(1);
    expect(agendaBtn.hasClass('active')).to.be.true;
    expect(otherBtn.hasClass('active')).to.be.false;

    agendaBtn.simulate('click');
    expectCalledWith(spy, { agenda: null });
  });

  it("renders negative buttons if 4 stars", () => {
    let spy = Sinon.spy();
    let wrapper = mount(<FeedbackTags
      onChange={spy}
      value={{ stars: 4 }}
    />);
    let buttons = wrapper.find('button');
    expect(buttons).to.have.length(5);
    buttons.at(0).simulate('click');
    buttons.at(1).simulate('click');
    buttons.at(2).simulate('click');
    buttons.at(3).simulate('click');
    buttons.at(4).simulate('click');

    expectCalledWith(spy, { agenda: false });
    expectCalledWith(spy, { on_time: false });
    expectCalledWith(spy, { good_time_mgmt: false });
    expectCalledWith(spy, { presence_useful: false });
    expectCalledWith(spy, { action_items: false });
  });

  it("renders existing negative feedback and allows unsetting", () => {
    let spy = Sinon.spy();
    let wrapper = mount(<FeedbackTags
      onChange={spy}
      value={{ stars: 4, agenda: false }}
    />);
    let buttons = wrapper.find('button');
    let agendaBtn = buttons.at(0);
    let otherBtn = buttons.at(1);
    expect(agendaBtn.hasClass('active')).to.be.true;
    expect(otherBtn.hasClass('active')).to.be.false;

    agendaBtn.simulate('click');
    expectCalledWith(spy, { agenda: null });
  });
});