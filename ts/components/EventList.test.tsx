import * as React from 'react';
import * as Sinon from 'sinon';
import { expect } from "chai";
import { shallow } from 'enzyme';
import { EventList, EventDisplay } from "./EventList";
import EventPlaceholder from "./EventPlaceholder";
import Tooltip from './Tooltip';
import Waypoint from './Waypoint';
import makeEvent from "../fakes/events-fake";
import { stubTimeouts } from "../fakes/stubs";
import { expectCalledWith } from "../lib/expect-helpers";
import { LabelSet } from "../lib/event-labels";

// Consts for tests
const e1 = makeEvent({ id: "e1" });
const e2 = makeEvent({ id: "e2" });
const e3 = makeEvent({ id: "e3" });
const confirmedEvent = makeEvent({ id: "c1", labels_confirmed: true });
const unconfirmedevent = makeEvent({ id: "u1", labels_confirmed: false });
const defaultsProps = {
  labels: new LabelSet([]),
  searchLabels: new LabelSet([]),
  onChange: () => null,
  onConfirm: () => null,
  onHideChange: () => null,
  eventHrefFn: () => "http://esper.com"
};

describe("EventList", () => {
  it("renders an EventDisplay for each valid event", () => {
    let wrapper = shallow(<EventList
      events={[e1, e2, e3]} { ...defaultsProps }
    />);
    expect(wrapper.find(EventDisplay)).to.have.length(3);
  });

  it("renders a placeholder if fetching", () => {
    let wrapper = shallow(<EventList
      events={[e1, "FETCHING", e3]} { ...defaultsProps }
    />);
    expect(wrapper.find(EventPlaceholder)).to.have.length(1);
    expect(wrapper.find(EventDisplay)).to.have.length(2);
  });

  it("doesn't render undefined events", () => {
    let wrapper = shallow(<EventList
      events={[e1, undefined, e3]} { ...defaultsProps }
    />);
    expect(wrapper.find(EventDisplay)).to.have.length(2);
  });

  it("doesn't render hidden, confirmed events", () => {
    let e1a = { ...e1, hidden: true, labels_confirmed: true };
    let wrapper = shallow(<EventList
      events={[e1a, e2]} { ...defaultsProps }
    />);
    let eventDisplay = wrapper.find(EventDisplay);
    expect(eventDisplay).to.have.length(1);
    expect(eventDisplay.prop('event').id).to.equal(e2.id);
  });

  it("renders hidden, unconfirmed events", () => {
    let e1a = { ...e1, hidden: true, labels_confirmed: false };
    let wrapper = shallow(<EventList
      events={[e1a, e2]} { ...defaultsProps }
    />);
    let eventDisplay = wrapper.find(EventDisplay);
    expect(eventDisplay).to.have.length(2);
  });

  it("does not hide events after props update", () => {
    let e1a = { ...e1, hidden: true, labels_confirmed: false };
    let e1b = { ...e1, hidden: true, labels_confirmed: true };
    let wrapper = shallow(<EventList
      events={[e1a, e2]} { ...defaultsProps }
    />);
    wrapper.setProps({ events: [e1b, e2] });
    wrapper.update();
    let eventDisplay = wrapper.find(EventDisplay);
    expect(eventDisplay).to.have.length(2);
  });

  it("updates confirmation status when EventDisplay fires " +
     "onExplicitConfirm firing", () => {
    let e1a = { ...e1, hidden: true, labels_confirmed: false };
    let wrapper = shallow(<EventList
      events={[e1a]} { ...defaultsProps }
    />);
    let eventDisplay = wrapper.find(EventDisplay);

    // Simulate clicking the show button
    eventDisplay.prop('onHideChange')!([e1.id], false);
    eventDisplay.prop('onExplicitConfirm')(e1.id);
    wrapper.setProps({ events: [e1] })
    wrapper.update();
    let updatedEventDisplay = wrapper.find(EventDisplay);
    expect(updatedEventDisplay.prop('unconfirmed')).to.not.be.ok;
  });

  it("renders hidden, confirmed events after clicking button", () => {
    let e1a = { ...e1, hidden: true, labels_confirmed: true };
    let wrapper = shallow(<EventList
      events={[e1a, e2]} { ...defaultsProps }
    />);
    let button = shallow(wrapper.find(Tooltip).prop('target'));
    button.simulate('click');

    wrapper.update();
    let eventDisplay = wrapper.find(EventDisplay);
    expect(eventDisplay).to.have.length(2);
  });

  it("re-hides hidden, confirmed events if button is clicked twice", () => {
    let e1a = { ...e1, hidden: true, labels_confirmed: true };
    let wrapper = shallow(<EventList
      events={[e1a, e2]} { ...defaultsProps }
    />);
    let button = shallow(wrapper.find(Tooltip).prop('target'));
    button.simulate('click');
    wrapper.update();

    button = shallow(wrapper.find(Tooltip).prop('target'));
    button.simulate('click');
    wrapper.update();

    let eventDisplay = wrapper.find(EventDisplay);
    expect(eventDisplay).to.have.length(1);
  });
});

describe("EventDisplay", () => {
  var timeouts: {
    fn: Function;
    time: number;
    cleared?: boolean;
  }[] = [];

  beforeEach(() => {
    timeouts = stubTimeouts();
  });

  const defaultsProps2 = {
    ...defaultsProps,
    onExplicitConfirm: () => null
  };

  it("renders a waypoint and adds CSS class if unconfirmed prop set",
  () => {
    let wrapper = shallow(<EventDisplay
      event={unconfirmedevent} { ...defaultsProps2 }
      unconfirmed={true}
    />);
    expect(wrapper.find(Waypoint)).to.have.length(1);
    expect(wrapper.hasClass('unconfirmed')).to.be.true;
  });

  it("doesn't render a waypoint or add CSS class if already confirmed", () => {
    let wrapper = shallow(<EventDisplay
      event={confirmedEvent} { ...defaultsProps2 }
      unconfirmed={false}
    />);
    expect(wrapper.find(Waypoint)).to.have.length(0);
    expect(wrapper.hasClass('unconfirmed')).to.be.false;
  });

  it("sets a timeout to confirm when waypoint is viewed", () => {
    let spy = Sinon.spy();
    let wrapper = shallow(<EventDisplay
      event={unconfirmedevent} { ...defaultsProps2 }
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
    expectCalledWith(spy, [unconfirmedevent.id]);
  });

  it("clears the timeout if we exit before timer clears", () => {
    let spy = Sinon.spy();
    let wrapper = shallow(<EventDisplay
      event={unconfirmedevent} { ...defaultsProps2 }
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
    let wrapper = shallow(<EventDisplay
      event={unconfirmedevent} { ...defaultsProps2 }
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

  it("calls onExplicitConfirm for unconfirmed event when clicked", () => {
    let spy = Sinon.spy();
    let wrapper = shallow(<EventDisplay
      event={unconfirmedevent} { ...defaultsProps2 }
      unconfirmed={true}
      onExplicitConfirm={spy}
    />);
    wrapper.simulate('click');
    expect(spy.called).to.be.true;
  });
});
