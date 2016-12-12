import * as React from 'react';
import * as ReactDOM from "react-dom";
import { expect } from "chai";
import { mount } from 'enzyme';
import { stubRAF } from "../fakes/stubs";
import { sandbox, spyWithCallback } from "../lib/sandbox";

import * as $ from "jquery";
import Overlay from './Overlay';

describe("<Overlay />", () => {
  const TEST_CONTAINER_ID = "overlay-test-container";

  beforeEach(() => {
    stubRAF();
  });

  afterEach(() => {
    let container = $("#" + TEST_CONTAINER_ID);
    if (container.length) {
      ReactDOM.unmountComponentAtNode(container.get(0));
    }
    $('body').empty();
  });

  it("renders overlay content at end of body", (done) => {
    // Expectations in callback because rendering is in another tick
    spyWithCallback(Overlay.prototype, "renderOverlay", {
      post: () => {
        try {
          let container = $("#" + TEST_CONTAINER_ID);
          expect(container).to.have.length(1);
          expect(container.is("body > *:last-child")).to.be.true;

          let content = container.find("#overlay-test");
          expect(content).to.have.length(1);

          done();
        }

        catch (err) {
          done(err);
        }
      }
    });

    // Fill body with some content to make sure overlay is at end
    $('body').append('<div>');
    $('body').append('<span>');
    $('body').append('<h3>');

    let overlay = <Overlay id={TEST_CONTAINER_ID}
      append={<div id="overlay-test">Some content</div>}
    />;
    mount(overlay);
  });

  it("updates when parents do so long as id is the same", (done) => {
    function Test({name}: {name: string}){
      return <Overlay id={TEST_CONTAINER_ID}
        append={<div id="overlay-test">{ name }</div>}
      />;
    }

    // Expectations in callback because rendering is in another tick
    var callCount = 0;
    spyWithCallback(Overlay.prototype, "renderOverlay", {
      post: () => {
        try {
          callCount += 1;

          // First call, trigger update
          if (callCount === 1) {
            wrapper.setProps({ name: "Adios" });
          }

          // Check expectations
          else {
            let container = $("#" + TEST_CONTAINER_ID);
            let content = container.find("#overlay-test");
            expect(content.text()).to.equal("Adios");
            done();
          }
        }

        catch (err) {
          done(err);
        }
      }
    });
    var wrapper = mount(<Test name="Hola" />);
  });

  it("clears overlay on unmount", function(done) {
    let spy = sandbox.spy(ReactDOM, "unmountComponentAtNode");
    let called = false;

    // Expectations in callback because rendering is in another tick
    spyWithCallback(Overlay.prototype, "clearOverlay", {
      post: () => {
        // clearOverlay may be called again by cleanup -- first run only
        if (called) return;
        else called = true;
        try {
          // unmountComponentAtNode should return true once to let us know
          // that we successfully unmounted something.
          expect(spy.calledOnce).to.be.true;
          expect(spy.returned(true)).to.be.true;

          let container = $("#" + TEST_CONTAINER_ID);
          expect(container).to.have.length(0);

          done();
        }

        catch (err) {
          done(err);
        }
      }
    });

    let overlay = <Overlay id={TEST_CONTAINER_ID}
      append={<div id="overlay-test">Some content</div>}
    />;
    let wrapper = mount(overlay);
    window.requestAnimationFrame(() => wrapper.unmount());
  });

  it("clears overlay on removal of append", function(done) {
    let spy = sandbox.spy(ReactDOM, "unmountComponentAtNode");
    let called = false;

    // Expectations in callback because rendering is in another tick
    spyWithCallback(Overlay.prototype, "clearOverlay", {
      post: () => {
        // clearOverlay may be called again by cleanup -- first run only
        if (called) return;
        else called = true;
        try {
          // unmountComponentAtNode should return true once to let us know
          // that we successfully unmounted something.
          expect(spy.calledOnce).to.be.true;
          expect(spy.returned(true)).to.be.true;

          let container = $("#" + TEST_CONTAINER_ID);
          expect(container).to.have.length(0);

          done();
        }

        catch (err) {
          done(err);
        }
      }
    });

    let overlay = <Overlay id={TEST_CONTAINER_ID}
      append={<div id="overlay-test">Some content</div>}
    />;
    let wrapper = mount(overlay);
    window.requestAnimationFrame(() => wrapper.setProps({ append: undefined }));
  });

  it("can render an inline element as well", function() {
    let content = <div id="overlay-test">Some content</div>;
    let overlay = <Overlay id={TEST_CONTAINER_ID}
      inline={content}
    />;
    let wrapper = mount(overlay);
    expect(wrapper.contains(content)).to.be.true;
  });
});