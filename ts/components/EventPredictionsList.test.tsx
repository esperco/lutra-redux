import * as React from 'react';
import { expect } from "chai";
import { shallow } from 'enzyme';
import { EventPredictionsList } from "./EventPredictionsList";
import Tooltip from './Tooltip';
import makeEvent from "../fakes/events-fake";

// Consts for tests
const hiddenConfirmed = makeEvent({
  id: "e1",
  hidden: true,
  labels_predicted: true,
  labels_confirmed: true
});
const hiddenUnconfirmed = makeEvent({
  id: "e2",
  hidden: true,
  labels_predicted: true,
  labels_confirmed: false
});
const normal = makeEvent({ id: "e3" });

describe("<EventPredictionsList />", () => {
  it("doesn't render hidden, confirmed events", () => {
    let wrapper = shallow(<EventPredictionsList
      events={[hiddenConfirmed, normal]}
      cb={(e) => <a key={e.id}>{ e.title }</a>}
    />);
    let a = wrapper.find('a');
    expect(a).to.have.length(1);
    expect(a.key()).to.equal(normal.id);
  });

  it("renders hidden, unconfirmed events", () => {
    let wrapper = shallow(<EventPredictionsList
      events={[hiddenUnconfirmed, normal]}
      cb={(e) => <a key={e.id}>{ e.title }</a>}
    />);
    expect(wrapper.find('a')).to.have.length(2);
  });

  it("renders hidden, confirmed events after clicking button", () => {
    let wrapper = shallow(<EventPredictionsList
      events={[hiddenConfirmed]}
      cb={(e) => <a key={e.id}>{ e.title }</a>}
    />);
    expect(wrapper.find('a')).to.have.length(0);

    let button = shallow(wrapper.find(Tooltip).prop('target'));
    button.simulate('click');
    wrapper.update();
    expect(wrapper.find('a')).to.have.length(1);
  });

  it("re-hides hidden, confirmed events if button is clicked twice", () => {
    let wrapper = shallow(<EventPredictionsList
      events={[hiddenConfirmed]}
      cb={(e) => <a key={e.id}>{ e.title }</a>}
    />);

    shallow(wrapper.find(Tooltip).prop('target')).simulate('click');
    wrapper.update();
    shallow(wrapper.find(Tooltip).prop('target')).simulate('click');
    wrapper.update()
    expect(wrapper.find('a')).to.have.length(0);
  });
});


