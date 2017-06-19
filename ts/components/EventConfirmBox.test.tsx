import * as React from 'react';
import * as Sinon from 'sinon';
import { expect } from "chai";
import { shallow } from 'enzyme';
import { EventConfirmSpan, EventConfirmBox } from "./EventConfirmBox";
import Waypoint from './Waypoint';
import makeEvent from "../fakes/events-fake";
import { stubTimeouts } from "../fakes/stubs";

// Consts for tests
const unconfirmedevent = makeEvent({
  id: "u1",
  labels_predicted: true,
  labels_confirmed: false
});
const confirmedEvent = makeEvent({
  id: "c1",
  labels_predicted: true,
  labels_confirmed: true
});

describe("<EventConfirmBox />", () => {
  it("renders a ConfirmSpan and adds CSS class if unconfirmed prop set", () => {
    let wrapper = shallow(<EventConfirmBox
      event={unconfirmedevent}
      onConfirm={() => null}
    >Hello</EventConfirmBox>);
    expect(wrapper.find(EventConfirmSpan)).to.have.length(1);
    expect(wrapper.hasClass('unconfirmed')).to.be.true;
  });

  it("doesn't render a waypoint or add CSS class if already confirmed", () => {
    let wrapper = shallow(<EventConfirmBox
      event={confirmedEvent}
      onConfirm={() => null}
    >Hello</EventConfirmBox>);
    expect(wrapper.find(EventConfirmSpan)).to.have.length(1);
    expect(wrapper.hasClass('unconfirmed')).to.be.false;
  });
});

describe("<ConfirmSpan />", () => {
  var timeouts: {
    fn: Function;
    time: number;
    cleared?: boolean;
  }[] = [];

  beforeEach(() => {
    timeouts = stubTimeouts();
  });

  it("sets a timeout to confirm when waypoint is viewed", () => {
    let spy = Sinon.spy();
    let wrapper = shallow(<EventConfirmSpan
      event={unconfirmedevent}
      onConfirm={spy}
      autoConfirmTimeout={1234}
    />);
    let waypoint = wrapper.find(Waypoint);
    waypoint.prop('onEnter')!({
      waypointTop: 0,
      viewportTop: 0,
      viewportBottom: 0,
      currentPosition: "inside",
      previousPosition: "below"
    });

    expect(timeouts).to.have.length(1);
    expect(timeouts[0].time).to.equal(1234);

    timeouts[0].fn();
    expect(spy.called).to.be.true;
  });

  it("clears the timeout if we exit before timer clears", () => {
    let spy = Sinon.spy();
    let wrapper = shallow(<EventConfirmSpan
      event={unconfirmedevent}
      onConfirm={spy}
      autoConfirmTimeout={1234}
    />);
    let waypoint = wrapper.find(Waypoint);
    waypoint.prop('onEnter')!({
      waypointTop: 0,
      viewportTop: 0,
      viewportBottom: 0,
      currentPosition: "inside",
      previousPosition: "below"
    });
    waypoint.prop('onLeave')!({
      waypointTop: 0,
      viewportTop: 0,
      viewportBottom: 0,
      currentPosition: "above",
      previousPosition: "inside"
    });

    expect(timeouts).to.have.length(1);
    expect(timeouts[0].cleared).to.be.ok;
  });

  it("clears the timeout on unmount", () => {
    let wrapper = shallow(<EventConfirmSpan
      event={unconfirmedevent} onConfirm={() => null}
    />);

    let waypoint = wrapper.find(Waypoint);
    waypoint.prop('onEnter')!({
      waypointTop: 0,
      viewportTop: 0,
      viewportBottom: 0,
      currentPosition: "inside",
      previousPosition: "below"
    });

    wrapper.unmount();
    expect(timeouts[0].cleared).to.be.ok;
  });
});