import * as React from 'react';
import { expect } from "chai";
import { shallow } from "enzyme";
import MultiRecurringLabelsModifier, { Props } from
  "./MultiRecurringLabelsModifier";
import makeEvent from "../fakes/events-fake";

function getWrapper(props: Partial<Props> = {}) {
  return shallow(<MultiRecurringLabelsModifier
    events={[makeEvent(), makeEvent({
      recurring_event_id: "something"
    })]}
    {...props}
  />);
}

describe("<RecurringLabelModifer />", () => {
  it("renders message if recurring events", () => {
    expect(getWrapper().type()).to.not.be.null;
  });

  it("renders null if not recurring", () => {
    expect(getWrapper({
      events: [makeEvent(), makeEvent()]
    }).type()).to.be.null;
  });
});