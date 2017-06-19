import * as React from 'react';
import * as ReactDOM from 'react-dom';
import * as $ from 'jquery';
import { shallow, ShallowWrapper } from 'enzyme';
import { expect } from "chai";
import TreeFall from './TreeFall';
import Waypoint from './Waypoint';
import { sandbox } from '../lib/sandbox';

// Helper function to stub jQuery bits to simulate being in view / out
export function stubJQ(top=0, height=50, parentHeight=100) {
  sandbox.restore();
  sandbox.stub(ReactDOM, 'findDOMNode').callsFake(() => 'div');
  sandbox.stub($.fn, 'offsetParent').callsFake(() => ({
    outerHeight: () => parentHeight
  }));
  sandbox.stub($.fn, 'position').callsFake(() => ({ left: 0, top }));
  sandbox.stub($.fn, 'outerHeight').callsFake(() => height);
}

describe('TreeFall', () => {
  class TestClass extends TreeFall<{ cats: number }, {}> {
    render() {
      return <div>
        <span className="cats">{ this.props.cats }</span>
        { this.renderWaypoint() }
      </div>;
    }
  }

  // Helper that returns rendered test component with a prop change
  function getWrapper() {
    let wrapper = shallow(<TestClass cats={5} />);
    wrapper.setProps({ cats: 6 });
    wrapper.update();
    return wrapper;
  }

  function assertWrapperUpdated(wrapper?: ShallowWrapper<any, any>) {
    wrapper = wrapper || getWrapper();
    expect(wrapper.find('.cats').text()).to.equal("6");
  }

  function assertWrapperDidNotUpdate(wrapper?: ShallowWrapper<any, any>) {
    wrapper = wrapper || getWrapper();
    expect(wrapper.find('.cats').text()).to.equal("5");
  }

  it("updates if bottom is inside offset parent", () => {
    stubJQ(-100, 200, 200);
    assertWrapperUpdated();
  });

  it("updates if top is inside offset parent", () => {
    stubJQ(100, 200, 200);
    assertWrapperUpdated();
  });

  it("updates if completely overlaps offset parent", () => {
    stubJQ(-100, 400, 200);
    assertWrapperUpdated();
  });

  it("does not update if completely above offset parent", () => {
    stubJQ(-300, 200, 200);
    assertWrapperDidNotUpdate();
  });

  it("does not update if completely below offset parent", () => {
    stubJQ(300, 200, 200);
    assertWrapperDidNotUpdate();
  });

  it("fires queued update upon waypoint firing if prior props change", () => {
    stubJQ(-300, 200, 200);
    let wrapper = getWrapper();
    let waypoint = wrapper.find(Waypoint);
    waypoint.prop('onEnter')!({
      waypointTop: 0,
      viewportTop: 0,
      viewportBottom: 0,
      currentPosition: "inside",
      previousPosition: "above"
    });
    wrapper.update();
    assertWrapperUpdated(wrapper);
  });

  it("does not fire queued update if no props change", () => {
    stubJQ(-300, 200, 200);
    let wrapper = shallow(<TestClass cats={5} />);
    let waypoint = wrapper.find(Waypoint);
    waypoint.prop('onEnter')!({
      waypointTop: 0,
      viewportTop: 0,
      viewportBottom: 0,
      currentPosition: "inside",
      previousPosition: "above"
    });
    wrapper.update();
    expect(wrapper.find('.cats').text()).to.equal('5');
  });
});