import * as React from 'react';
import { expect } from "chai";
import { shallow } from "enzyme";
import * as Sinon from "sinon";
import { expectCalledWith } from "../lib/expect-helpers";
import Dropdown from "./Dropdown";
import MultiEventEditor, { Props } from "./MultiEventEditor";
import EventPlaceholder from "./EventPlaceholder";
import makeEvent from "../fakes/events-fake";

describe("<MultiEventEditor />", () => {
  function getWrapper(props: Partial<Props> = {}) {
    return shallow(
      <MultiEventEditor
        events={[makeEvent()]}
        {...props}
      >
        <div className="child" />
      </MultiEventEditor>
    );
  }

  it("renders event info and child", () => {
    let wrapper = getWrapper();
    expect(wrapper.find("h3")).to.have.length(1);
    expect(wrapper.find(".child")).to.have.length(1);
  });

  it("renders Dropdown with valid events assed to menu callback", () => {
    let spy = Sinon.spy((events: any[]) => <div className="menu" />);
    let e1 = makeEvent({ id: "e1" });
    let e2 = makeEvent({ id: "e2" });
    let wrapper = getWrapper({
      menu: spy,
      events: [e1, "FETCH_ERROR", undefined, e2]
    });
    expect(wrapper.find(Dropdown)).to.have.length(1);
    expectCalledWith(spy, [e1, e2]);
  });

  it("renders placeholder if any events are FETCHING", () => {
    let e1 = makeEvent({ id: "e1" });
    let wrapper = getWrapper({
      events: [e1, "FETCHING"]
    });
    expect(wrapper.find(EventPlaceholder)).to.have.length(1);
  });

  it("handles no events gracefully", () => {
    getWrapper({ events: []  });
  });
});
