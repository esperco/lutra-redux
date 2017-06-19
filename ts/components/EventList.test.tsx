import * as React from 'react';
import { expect } from "chai";
import { shallow } from 'enzyme';
import makeEvent from "../fakes/events-fake";
import { mapEvents, EventList } from "./EventList";
import EventPlaceholder from "./EventPlaceholder";

const e1 = makeEvent({ id: "e1" });
const e2 = makeEvent({ id: "e2" });
const e3 = makeEvent({ id: "e3" });

describe("mapEvents", () => {
  it("returns callback value for each valid event passed", () => {
    expect(mapEvents({
      events: [e1, e2, e3],
      cb: (e) => e.id
    })).to.deep.equal([e1.id, e2.id, e3.id]);
  });

  it("renders a placeholder if fetching", () => {
    let r = mapEvents({
      events: [e1, "FETCHING", e3],
      cb: (e) => e.id
    });
    expect(r[0]).to.equal(e1.id);
    expect((r[1] as JSX.Element).type).to.equal(EventPlaceholder as any);
    expect(r[2]).to.equal(e3.id);
  });

  it("doesn't render undefined events", () => {
    expect(mapEvents({
      events: [e1, undefined, e3],
      cb: (e) => e.id
    })).to.deep.equal([e1.id, e3.id]);
  });
});

describe("<EventList />", () => {
  it("renders a list of callbacks in div for each valid event", () => {
    let wrapper = shallow(<EventList
      className="test"
      events={[e1, e2, "FETCHING"]}
      cb={(e) => <a key={e.id} href="">{e.title}</a>}
    />);
    expect(wrapper.hasClass("test")).to.be.true;
    expect(wrapper.find("a")).to.have.length(2);
  });
});
