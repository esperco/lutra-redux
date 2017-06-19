import * as React from "react";
import { expect } from "chai";
import { shallow } from "enzyme";
import * as Sinon from "sinon";
import makeEvent from "../fakes/events-fake";
import { expectCalledWith } from "../lib/expect-helpers";
import { ready } from "../states/data-status";
import DayBox from "./DayBox";
import QueryDay from "./QueryDay";
import Waypoint from "./Waypoint";
import { stubJQ } from "./TreeFall.test";

const result = {
  query: {},
  eventIds: ["e1", "e2"],
  updatedOn: new Date()
};
const eventMap = {
  e1: makeEvent({ id: "e1" }),
  e2: makeEvent({ id: "e2" })
};
const defaultBaseProps = {
  day: 123,
  result,
  eventMap
};

const getWrapper = (eventIds?: string[]) => {
  let props = defaultBaseProps;
  if (eventIds) {
    props = {
      ...defaultBaseProps,
      result: { ...defaultBaseProps.result, eventIds }
    };
  }

  return shallow(<QueryDay
    { ...props }
    cb={(events) => events.map(
      (e) => ready(e) ? <span key={e.id}>{ e.id }</span> : null
    )}
  />);
};

describe("<QueryDay />", () => {
  beforeEach(() => stubJQ());

  it("renders DayBox and calls cb for each event", () => {
    let wrapper = getWrapper();
    let daybox = wrapper.find(DayBox);
    expect(daybox).to.have.length(1);

    let children = daybox.children().find('span');
    expect(children.at(0).text()).to.equal(eventMap.e1.id);
    expect(children.at(1).text()).to.equal(eventMap.e2.id);
  });

  it("renders Waypoints at start and end for events", () => {
    let wrapper = getWrapper();
    expect(wrapper.find(Waypoint)).to.have.length(2);
  });

  it("renders only a Waypoint if no events", () => {
    let wrapper = getWrapper([]);
    expect(wrapper.find(Waypoint)).to.have.length(1)
  });

  it("calls callback with FETCHING if applicable", () => {
    let spy = Sinon.spy();
    shallow(<QueryDay
      { ...defaultBaseProps }
      result="FETCHING"
      cb={spy}
    />);
    expectCalledWith(spy, ["FETCHING"]);
  });
});
