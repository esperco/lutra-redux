import * as React from "react";
import { expect } from "chai";
import { mount, shallow } from "enzyme";
import makeEvent from "../fakes/events-fake";
import { stubRAF } from "../fakes/stubs";
import GuestList from "./GuestList";

describe("<GuestList />", () => {
  beforeEach(() => { stubRAF(); })

  it("renders events with declined guests or no display names", () => {
    let wrapper = mount(<GuestList
      event={makeEvent({
        guests: [{
          email: "a@b.com",
          response: "Declined"
        }, {
          email: "c@d.com",
          response: "Accepted"
        }, {
          email: "e@f.com",
          display_name: "Eggo",
          response: "Needs_action"
        }]
      })}
    />);
    expect(wrapper.find('.guest')).to.have.length(3);
    expect(wrapper.find('.declined')).to.have.length(1);
  });

  it("accepts an hrefFn", () => {
    let wrapper = mount(<GuestList
      hrefFn={(g) => "/test?e=" + g.email}
      event={makeEvent({
        guests: [{
          email: "a@b.com",
          response: "Declined"
        }, {
          email: "c@d.com",
          response: "Accepted"
        }]
      })}
    />);

    let links = wrapper.find('a');
    expect(links).to.have.length(2);
    expect(links.at(0).prop('href')).to.equal("/test?e=a@b.com");
    expect(links.at(1).prop('href')).to.equal("/test?e=c@d.com");
  });

  it("returns null if event has no guests", () => {
    let wrapper = shallow(<GuestList event={makeEvent({ guests: [] })} />);
    expect(wrapper.type()).to.be.null;
  });
});