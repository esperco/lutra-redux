import * as React from 'react';
import { expect } from "chai";
import { shallow } from "enzyme";
import * as Sinon from "sinon";
import RecurringTimebombModifier, { Props } from "./RecurringTimebombModifier";
import makeEvent from "../fakes/events-fake";
import { sandbox } from "../lib/sandbox";

function getWrapper(props: Partial<Props> = {}) {
  return shallow(<RecurringTimebombModifier
    event={makeEvent({
      timebomb: ["Stage0", { set_by: "2099-10-01T00:00:00.000Z" }]
    })}
    onForceInstance={() => null}
    {...props}
  />);
}

describe("<RecurringTimebombModifier />", () => {
  beforeEach(() => {
    sandbox.useFakeTimers((new Date("2016-10-01T00:00:00.000Z")).getTime());
  });

  it("renders recurring events with button to treat as instance", () => {
    let spy = Sinon.spy();
    let wrapper = getWrapper({
      event: makeEvent({
        recurring_event_id: "something",
        timebomb: ["Stage0", { set_by: "2099-10-01T00:00:00.000Z" }]
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
        timebomb_pref: false,
        timebomb: ["Stage0", { set_by: "2099-10-01T00:00:00.000Z" }]
      })
    }).find('button')).to.have.length(0);
  });

  it("renders non-recurring events as null", () => {
    expect(getWrapper().type()).to.be.null;
  });

  it("renders events past deadline as null", () => {
    expect(getWrapper({
      event: makeEvent({
        timebomb: ["Stage0", { set_by: "2016-09-01T00:00:00.000Z" }]
      })
    }).type()).to.be.null;
  });
});