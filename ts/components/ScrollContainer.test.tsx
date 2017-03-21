import * as React from 'react';
import * as Sinon from 'sinon';
import { mount, ReactWrapper } from 'enzyme';
import { expect } from 'chai';
import ScrollContainer from './ScrollContainer';
import { expectCalledWith } from "../lib/expect-helpers";
import { sandbox } from "../lib/sandbox";

describe('ScrollContainer', () => {
  var addEventListenerStub: Sinon.SinonSpy;
  var removeEventListenerStub: Sinon.SinonSpy;

  beforeEach(() => {
    addEventListenerStub = sandbox.stub(
      (window as any).HTMLDivElement.prototype,
      "addEventListener"
    ).callsFake(() => null);
    removeEventListenerStub = sandbox.stub(
      (window as any).HTMLDivElement.prototype,
      "removeEventListener"
    ).callsFake(() => null);
  });

  function scroll(wrapper: ReactWrapper<any, any>, change: number) {
    let instance = wrapper.instance() as ScrollContainer;
    let div = instance._div as HTMLDivElement;
    let lastScroll = div.scrollTop || 0;
    div.scrollTop = lastScroll + change;
    addEventListenerStub.getCall(0).args[1]();
  }

  it("adds a scroll listener", () => {
    mount(<ScrollContainer onScrollChange={() => null} />);
    expect(addEventListenerStub.callCount).to.equal(1);
    expect(addEventListenerStub.getCall(0).args[0]).to.equal('scroll');
  });

  it("calls onScrollChange with direction on initial scroll", () => {
    let spy = Sinon.spy();
    let wrapper = mount(<ScrollContainer threshold={0} onScrollChange={spy} />);
    scroll(wrapper, 100);
    expectCalledWith(spy, "down");
  });

  it("does not call onScrollChange twice after multiple downs", () => {
    let spy = Sinon.spy();
    let wrapper = mount(<ScrollContainer threshold={0} onScrollChange={spy} />);
    scroll(wrapper, 100);
    scroll(wrapper, 100);
    expect(spy.callCount).to.equal(1);
  });

  it("does not call onScrollChange twice after multiple ups", () => {
    let spy = Sinon.spy();
    let wrapper = mount(<ScrollContainer threshold={0} onScrollChange={spy} />);
    scroll(wrapper, 1000); // Scroll down first to make room to go up
    spy.reset();

    scroll(wrapper, -100);
    scroll(wrapper, -100);
    expect(spy.callCount).to.equal(1);
  });

  it("calls onScrollChange after scroll changes from down to up", () => {
    let spy = Sinon.spy();
    let wrapper = mount(<ScrollContainer threshold={0} onScrollChange={spy} />);

    scroll(wrapper, 100);
    scroll(wrapper, -100);
    expect(spy.callCount).to.equal(2);
    expectCalledWith(spy, "down");
    expectCalledWith(spy, "up");
  });

  it("calls onScrollChange after scroll changes from up to down", () => {
    let spy = Sinon.spy();
    let wrapper = mount(<ScrollContainer threshold={0} onScrollChange={spy} />);
    scroll(wrapper, 100);
    spy.reset();

    scroll(wrapper, -100);
    scroll(wrapper, 100);
    expect(spy.callCount).to.equal(2);
    expectCalledWith(spy, "up");
    expectCalledWith(spy, "down");
  });

  it("does not trigger until scroll greater than threshold", () => {
    let spy = Sinon.spy();
    let wrapper = mount(<ScrollContainer
      threshold={100}
      onScrollChange={spy}
    />);
    scroll(wrapper, 51);
    expect(spy.called).to.be.false;
    scroll(wrapper, 51);
    expectCalledWith(spy, "down");
  });
});

