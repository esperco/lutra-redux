import * as React from 'react';
import { expect } from "chai";
import { shallow } from "enzyme";
import * as Sinon from "sinon";
import RecurringFeedbackModifier, { Props } from "./RecurringFeedbackModifier";
import makeEvent from "../fakes/events-fake";

function getWrapper(props: Partial<Props> = {}) {
  return shallow(<RecurringFeedbackModifier
    event={makeEvent()}
    onForceInstance={() => null}
    {...props}
  />);
}

describe("<RecurringFeedbackModifier />", () => {
  it("renders recurring events with button to treat as instance", () => {
    let spy = Sinon.spy();
    let wrapper = getWrapper({
      event: makeEvent({
        recurring_event_id: "something",
      }),
      onForceInstance: spy
    });
    let button = wrapper.find('button');
    button.simulate('click');
    expect(spy.called).to.be.true;
  });

  it("renders recurring events in single instance mode without button", () => {
    expect(getWrapper({
      event: makeEvent({
        recurring_event_id: "something",
        feedback_pref: false
      })
    }).find('button')).to.have.length(0);
  });

  it("renders non-recurring events as null", () => {
    expect(getWrapper().type()).to.be.null;
  });
});