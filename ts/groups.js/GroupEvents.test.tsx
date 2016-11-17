import * as React from 'react';
import { expect } from "chai";
import { shallow } from 'enzyme';
import { expectCalledWith } from "../lib/expect-helpers";
import { simulateInput } from "../lib/react-test-helpers";
import * as Sinon from 'sinon';

import initState from "./init-state";
import GroupEvents from './GroupEvents';

describe("<GroupEvents />", () => {
  it("should dispatch IncrAction when button is clicked", () => {
    let dispatch = Sinon.spy();
    let state = initState();
    let wrapper = shallow(<GroupEvents {... {state, dispatch}} />);
    wrapper.find('button').simulate('click');
    expect(dispatch.getCall(0).args).to.deep.equal([{
      type: "INCR",
      value: 1
    }]);
  });

  it("should dispatch NameChangeAction when input is changed", () => {
    let dispatch = Sinon.spy();
    let state = initState();
    let wrapper = shallow(<GroupEvents {... {state, dispatch}} />);
    simulateInput(wrapper.find('input'), "Who?");
    expectCalledWith(dispatch, {
      type: "NAME_CHANGE",
      value: "Who?"
    });
  });
});