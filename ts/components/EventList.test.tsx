import * as React from 'react';
import * as Sinon from 'sinon';
import { expect } from "chai";
import { shallow } from 'enzyme';
import { EventList, EventDisplay, PlaceholderEvent } from "./EventList";
import Tooltip from './Tooltip';
import Waypoint from './Waypoint';
import makeEvent from "../fakes/events-fake";
import { testLabel } from "../fakes/labels-fake";
import { expectCalledWith } from "../lib/expect-helpers";
import { LabelSet } from "../lib/event-labels";
import { stub as stubGlobal } from '../lib/sandbox';

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
    expect(wrapper.find(PlaceholderEvent)).to.have.length(1);
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
});

describe("EventDisplay", () => {
  var timeouts: {
    fn: Function;
    time: number;
    cleared?: boolean;
  }[] = [];
  var setTimeoutStub: Sinon.SinonStub;
  var clearTimeoutStub: Sinon.SinonStub;

  beforeEach(() => {
    timeouts = [];

    setTimeoutStub = stubGlobal("setTimeout",
      (fn: Function, time: number) => {
        let n = timeouts.length;
        timeouts.push({ fn, time });
        return n;
      });

    clearTimeoutStub = stubGlobal("clearTimeout", (n: number) => {
      let t = timeouts[n];
      if (t) {
        t.cleared = true;
      }
    });
  });

  it("renders a waypoint and adds CSS class if event needs confirmation",
  () => {
    let wrapper = shallow(<EventDisplay
      event={unconfirmedevent} { ...defaultsProps }
    />);
    expect(wrapper.find(Waypoint)).to.have.length(1);
    expect(wrapper.hasClass('unconfirmed')).to.be.true;
  });

  it("doesn't render a waypoint or add CSS class if already confirmed", () => {
    let wrapper = shallow(<EventDisplay
      event={confirmedEvent} { ...defaultsProps }
    />);
    expect(wrapper.find(Waypoint)).to.have.length(0);
    expect(wrapper.hasClass('unconfirmed')).to.be.false;
  });

  it("sets a timeout to confirm when waypoint is viewed", () => {
    let spy = Sinon.spy();
    let wrapper = shallow(<EventDisplay
      event={unconfirmedevent} { ...defaultsProps }
      onConfirm={spy}
      autoConfirmTimeout={1234}
    />);
    let waypoint = wrapper.find(Waypoint);
    waypoint.prop('onEnter')({
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
      event={unconfirmedevent} { ...defaultsProps }
      onConfirm={spy}
      autoConfirmTimeout={1234}
    />);
    let waypoint = wrapper.find(Waypoint);
    waypoint.prop('onEnter')({
      currentPosition: "inside",
      previousPosition: "below"
    });
    waypoint.prop('onLeave')({
      currentPosition: "above",
      previousPosition: "inside"
    });

    expect(timeouts).to.have.length(1);
    expect(timeouts[0].cleared).to.be.ok;
  });

  it("clears the timeout on unmount", () => {
    let wrapper = shallow(<EventDisplay
      event={unconfirmedevent} { ...defaultsProps }
    />);

    let waypoint = wrapper.find(Waypoint);
    waypoint.prop('onEnter')({
      currentPosition: "inside",
      previousPosition: "below"
    });

    wrapper.unmount();
    expect(timeouts[0].cleared).to.be.ok;
  });

  it("continues display confirmed CSS even after timeout fires and event " +
     "is confirmed", () => {
    let wrapper = shallow(<EventDisplay
      event={unconfirmedevent} { ...defaultsProps }
    />);

    let waypoint = wrapper.find(Waypoint);
    waypoint.prop('onEnter')({
      currentPosition: "inside",
      previousPosition: "below"
    });
    timeouts[0].fn();
    wrapper.setProps({
      event: { ...unconfirmedevent, labels_confirmed: true, }
    });

    wrapper.update();
    expect(wrapper.hasClass('unconfirmed')).to.be.true;
  });

  it("clears confirmed visual state when event title is clicked", () => {
    let wrapper = shallow(<EventDisplay
      event={unconfirmedevent} { ...defaultsProps }
    />);
    let title = wrapper.find('a').first();
    title.simulate('click');
    wrapper.update();
    expect(wrapper.hasClass('unconfirmed')).to.not.be.ok;
  });

  it("clears confirmed visual state if labels change", () => {
    let wrapper = shallow(<EventDisplay
      event={unconfirmedevent} { ...defaultsProps }
    />);
    wrapper.setProps({
      event: {
        ...unconfirmedevent,
        labels_confirmed: true,
        labels: [testLabel("TEST")]
      }
    });
    wrapper.update();
    expect(wrapper.hasClass('unconfirmed')).to.not.be.ok;
  });
});
