import * as React from 'react';
import { expect } from "chai";
import { shallow } from 'enzyme';
import Dropdown from "./Dropdown";
import EventEditor, { Props } from "./EventEditor";
import { Title } from "./EventInfo";
import EventPlaceholder from "./EventPlaceholder";
import makeEvent from "../fakes/events-fake";

describe("<EventEditor />", () => {
  function getWrapper(props: Partial<Props> = {}) {
    return shallow(
      <EventEditor
        event={makeEvent()}
        {...props}
      >
        <div className="child" />
      </EventEditor>
    );
  }

  it("renders event info and child", () => {
    let wrapper = getWrapper();
    expect(wrapper.find(Title)).to.have.length(1);
    expect(wrapper.find(".child")).to.have.length(1);
  });

  it("renders Dropdown if menu passed", () => {
    let wrapper = getWrapper({
      menu: (e) => <div className="menu"></div>
    });
    expect(wrapper.find(Dropdown)).to.have.length(1);
  });

  it("renders placeholder if passed FETCHING", () => {
    let wrapper = getWrapper({
      event: "FETCHING"
    });
    expect(wrapper.find(EventPlaceholder)).to.have.length(1);
  });

  it("handles errors gracefully", () => {
    getWrapper({ event: "FETCH_ERROR"  });
  });

  it("handles undefined events gracefully", () => {
    getWrapper({ event: undefined  });
  });
});
