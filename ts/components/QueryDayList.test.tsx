import * as React from "react";
import { expect } from "chai";
import { shallow } from "enzyme";
import { QueryFilter, stringify } from "../lib/event-queries";
import { initState, EventsState } from "../states/events";
import { QueryDayList, Props } from "./QueryDayList";
import QueryDay from "./QueryDay";
import Waypoint from "./Waypoint";

const maxDays = 5;

// Fake eventQueries state
function prePop(
  state: EventsState,
  groupId: string,
  start: number, end: number,
  query: QueryFilter
) {
  state.eventQueries[groupId] = state.eventQueries[groupId] || [];
  state.events[groupId] = state.events[groupId] || {};
  for (let i = start; i <= end + 1; i++) {
    state.eventQueries[groupId][i] = state.eventQueries[groupId][i] || {};
    state.eventQueries[groupId][i][stringify(query)] = {
      query,
      eventIds: [],
      updatedOn: new Date()
    }
  }
}

var defaultProps: Props = {
  calgroupId: "groupId",
  period: { interval: "day" as "day", start: 100, end: 111 },
  query: {},
  state: initState(),
  cb: () => null,
  maxDays
};

prePop(defaultProps.state, "groupId", 100, 121, {});
prePop(defaultProps.state, "groupId", 100, 121, { contains: "hello" });
prePop(defaultProps.state, "groupId2", 100, 121, {});

function getWrapper(p: Partial<Props> = {}) {
  let props = { ...defaultProps, ...p };
  return shallow(<QueryDayList {...props} />);
}

function getWrapperAndUpdate(p: Partial<Props> = {}) {
  let wrapper = getWrapper(p);
  let waypoint = wrapper.find(Waypoint);
  waypoint.prop('onEnter')!({
    waypointTop: 0,
    viewportTop: 0,
    viewportBottom: 0,
    currentPosition: "inside",
    previousPosition: "above"
  });
  wrapper.update();
  return wrapper;
}

describe("<QueryDayList />", () => {
  it("renders up to maxDays queryDays", () => {
    expect(getWrapper().find(QueryDay)).to.have.length(5);
  });

  it("loads more when Waypoint is visible", () => {
    let wrapper = getWrapper();
    let waypoint1 = wrapper.find(Waypoint);
    waypoint1.prop('onEnter')!({
      waypointTop: 0,
      viewportTop: 0,
      viewportBottom: 0,
      currentPosition: "inside",
      previousPosition: "above"
    });
    wrapper.update();
    expect(wrapper.find(QueryDay)).to.have.length(10);

    // Check for next waypoint -- key should be different so onEnter
    // can be triggered again
    let waypoint2 = wrapper.find(Waypoint);
    expect(waypoint2.key()).to.not.equal(waypoint1.key());
    waypoint2.prop('onEnter')!({
      waypointTop: 0,
      viewportTop: 0,
      viewportBottom: 0,
      currentPosition: "inside",
      previousPosition: "above"
    });
    wrapper.update();
    expect(wrapper.find(QueryDay)).to.have.length(12); // Remainder
  });

  it("resets when period changes", () => {
    let wrapper = getWrapperAndUpdate();
    wrapper.setProps({
      period: { interval: "day", start: 110, end: 122 },
    });
    wrapper.update();
    expect(wrapper.find(QueryDay)).to.have.length(5);
  });

  it("resets when query changes", () => {
    let wrapper = getWrapperAndUpdate();
    wrapper.setProps({
      query: { contains: "hello" }
    });
    wrapper.update();
    expect(wrapper.find(QueryDay)).to.have.length(5);
  });

  it("resets when calgroupId changes", () => {
    let wrapper = getWrapperAndUpdate();
    wrapper.setProps({ calgroupId: "groupId2"  });
    wrapper.update();
    expect(wrapper.find(QueryDay)).to.have.length(5);
  });
});