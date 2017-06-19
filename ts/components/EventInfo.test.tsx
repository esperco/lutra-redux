import * as React from 'react';
import { expect } from "chai";
import { mount, shallow } from 'enzyme';
import { stubRAF } from "../fakes/stubs";
import * as ApiT from "../lib/apiT";
import {
  InlineInfo, Title, Time, Box, Location, Description
} from "./EventInfo";
import makeEvent from "../fakes/events-fake";

const start = (new Date(2016, 4, 1)).toISOString();
const end = (new Date(2016, 4, 2)).toISOString();
const title = "The title";
const location = "Some place";
const description = "Hello world."
const guests: ApiT.Attendee[] = [{
  email: "a@b.com",
  response: "Accepted"
}, {
  email: "c@d.com",
  response: "Accepted"
}, {
  email: "e@f.com",
  response: "Declined"
}];
const merged = {
  sources: [{ eventid: "id", calid: "calid", teamid: "teamid" }],
  number_of_ratings: 0,
  cost: 3
};
const event = makeEvent({
  title, location, description, merged, guests,
  start, end
});

describe("<InlineInfo />", () => {
  beforeEach(() => {
    stubRAF();
  });

  it("does not include day in time by default", () => {
    let wrapper = mount(<InlineInfo event={event} />);
    expect(wrapper.text()).not.contains("May 1");
  });

  it("includes day in time if includeDay passed", () => {
    let wrapper = mount(<InlineInfo event={event} includeDay={true} />);
    expect(wrapper.text()).contains("May 1");
  });

  it("does not include declined guests in tooltip", () => {
    let wrapper = mount(<InlineInfo event={event} />);
    expect(wrapper.find('.guests').text()).to.equal("Person2");
  });

  it("includes cost as a number of dollar signs", () => {
    let wrapper = mount(<InlineInfo event={event} />);
    expect(wrapper.find('.cost').text()).to.equal("$$$");
  });

  it("renders simple event without error", () => {
    mount(<InlineInfo event={makeEvent()} />);
  });
});

describe("<Box />", () => {
  it("assigns a past class for past events", () => {
    let wrapper = shallow(<Box event={makeEvent({
      start: (new Date(Date.now() - 1000)).toISOString(),
      end: (new Date(Date.now() - 900)).toISOString()
    })}>Hello</Box>);
    expect(wrapper.hasClass('past')).to.be.true;
  });

  it("does not assign a past class for present / future events", () => {
    let wrapper = shallow(<Box event={makeEvent({
      start: (new Date(Date.now() - 1000)).toISOString(),
      end: (new Date(Date.now() + 1000)).toISOString()
    })}>Hello</Box>);
    expect(wrapper.hasClass('past')).to.be.false;
  });
});

describe("<Title />", () => {
  it("renders a link if href passed", () => {
    let wrapper = shallow(<Title event={event} href="/" />);
    expect(wrapper.find('a')).to.have.length(1);
    expect(wrapper.find('.event-title')).to.have.length(1);
    expect(wrapper.find('.no-title')).to.have.length(0);
    expect(wrapper.text()).includes(title);
  });

  it("renders a span if no href passed", () => {
    let wrapper = shallow(<Title event={event} />);
    expect(wrapper.find('a')).to.have.length(0);
    expect(wrapper.find('.event-title')).to.have.length(1);
    expect(wrapper.find('.no-title')).to.have.length(0);
    expect(wrapper.text()).includes(title);
  });

  it("handles no-title mode fine", () => {
    let wrapper = shallow(<Title event={{
      ...event, title: undefined
    }} />);
    expect(wrapper.find('.event-title')).to.have.length(1);
    expect(wrapper.find('.no-title')).to.have.length(1);
  });
});

describe("<Time />", () => {
  beforeEach(() => {
    stubRAF();
  })

  it("includes recurring icon for recurring events", () => {
    expect(mount(<Time event={makeEvent({
      recurring_event_id: "some-id"
    })} />).find('.recurring')).to.have.length(1);
  });
});

describe("<Location />", () => {
  it("renders without error", () => {
    shallow(<Location event={event} />);
  });
});

describe("<Description />", () => {
  it("renders without error", () => {
    shallow(<Description event={event} />);
  });
});