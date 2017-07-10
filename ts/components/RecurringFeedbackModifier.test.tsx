import * as React from 'react';
import { expect } from "chai";
import { shallow } from "enzyme";
import * as Sinon from "sinon";
import RecurringFeedbackModifier, { Props } from "./RecurringFeedbackModifier";
import makeEvent from "../fakes/events-fake";
import { sandbox } from "../lib/sandbox";

function getWrapper(props: Partial<Props> = {}) {
  return shallow(<RecurringFeedbackModifier
    event={makeEvent({
      start: "2016-10-01T00:00:00.000Z",
      end: "2016-10-03T00:00:00.000Z"
    })}
    onForceInstance={() => null}
    {...props}
  />);
}

describe("<RecurringFeedbackModifier />", () => {
  beforeEach(() => {
    sandbox.useFakeTimers((new Date("2016-10-02T00:00:00.000Z")).getTime());
  });

  it("renders recurring events with button to treat as instance", () => {
    let spy = Sinon.spy();
    let wrapper = getWrapper({
      event: makeEvent({
        start: "2016-10-01T00:00:00.000Z",
        end: "2016-10-03T00:00:00.000Z",
        recurring_event_id: "something"
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
        start: "2016-10-01T00:00:00.000Z",
        end: "2016-10-03T00:00:00.000Z",
        recurring_event_id: "something",
        feedback_pref: false
      })
    }).find('button')).to.have.length(0);
  });

  it("renders non-recurring events as null", () => {
    expect(getWrapper().type()).to.be.null;
  });

  it("renders events past deadline as null", () => {
    expect(getWrapper({
      event: makeEvent({
        start: "2016-10-01T00:00:00.000Z",
        end: "2016-10-01T01:00:00.000Z"
      })
    }).type()).to.be.null;
  });
});