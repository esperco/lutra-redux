import * as React from 'react';
import { expect } from "chai";
import { shallow } from "enzyme";
import * as Sinon from "sinon";
import RecurringLabelModifier, { Props } from "./RecurringLabelModifier";
import makeEvent from "../fakes/events-fake";

function getWrapper(props: Partial<Props> = {}) {
  return shallow(<RecurringLabelModifier
    event={makeEvent()}
    onForceInstance={() => null}
    {...props}
  />);
}

describe("<RecurringLabelModifer />", () => {
  it("renders recurring events with button to treat as instance", () => {
    let spy = Sinon.spy();
    let wrapper = getWrapper({
      event: makeEvent({
        recurring_event_id: "something",
        labels: [],
        has_recurring_labels: true
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
        labels: [],
        labels_predicted: false,
        has_recurring_labels: false
      })
    }).find('button')).to.have.length(0);
  });

  it("renders non-recurring events as null", () => {
    expect(getWrapper().type()).to.be.null;
  });
});