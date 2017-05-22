import * as React from "react";
import { expect } from "chai";
import { mount } from 'enzyme';
import * as Sinon from "sinon";
import EventLanding from "./EventLanding";
import analyticsSvcFactory from "../fakes/analytics-fake";
import navSvcFactory from "../fakes/nav-fake";
import { apiSvcFactory, stubApi } from "../fakes/api-fake";
import makeEvent from "../fakes/events-fake";
import { stubLogs } from "../fakes/stubs";
import { expectCalledWith } from "../lib/expect-helpers";
import { stub as stubGlobal } from "../lib/sandbox";

describe("<EventLanding />", () => {
  const event = makeEvent({
    id: "id-1",
    title: "My Event Title",
    timebomb: ["Stage1", {
      confirm_by: "2100-10-10",
      contributors: []
    }]
  });
  const tokens = {
    keep: "keep-token",
    cancel: "cancel-token"
  };

  function getProps() {
    let analytics = analyticsSvcFactory();
    let api = apiSvcFactory();
    let nav = navSvcFactory();
    return {
      tokens,
      Svcs: {
        ...analytics,
        ...api,
        ...nav
      }
    };
  }

  const location = {
    pathname: "/b",
    hash: "",
    href: ""
  };

  beforeEach(function() {
    stubGlobal("location", location);
  });

  it("posts keep token on mount if specified", () => {
    let props = getProps();
    let spy = Sinon.spy(props.Svcs.Api, "postToken");
    mount(<EventLanding {...props} actionOnMount="keep" />);
    expectCalledWith(spy, tokens.keep);
  });

  it("posts cancel token on mount if specified", () => {
    let props = getProps();
    let spy = Sinon.spy(props.Svcs.Api, "postToken");
    mount(<EventLanding {...props} actionOnMount="cancel" />);
    expectCalledWith(spy, tokens.cancel);
  });

  it("calls Analytics page on mount", () => {
    let props = getProps();
    let spy = Sinon.spy(props.Svcs.Analytics, "page");
    mount(<EventLanding {...props} actionOnMount="keep" />);
    expectCalledWith(spy, location.pathname, { action: "keep" });
  });

  it("renders placeholders while waiting for response", () => {
    let props = getProps();
    let wrapper = mount(<EventLanding {...props} actionOnMount="keep" />);
    expect(wrapper.find('.placeholder')).to.have.length.greaterThan(0);
  });

  it("handles Invalid_token error gracefully", (done) => {
    let props = getProps();
    let dfd = stubApi(props.Svcs, "postToken");
    let wrapper = mount(<EventLanding {...props} actionOnMount="keep" />);
    dfd.resolve("Invalid_token");
    dfd.promise().then(() => {
      wrapper = wrapper.update();
      expect(wrapper.find('.alert.danger')).to.have.length(1);
    }).then(done, done);
  });

  it("handles Expired_token error gracefully", (done) => {
    let props = getProps();
    let dfd = stubApi(props.Svcs, "postToken");
    let wrapper = mount(<EventLanding {...props} actionOnMount="keep" />);
    dfd.resolve("Expired_token");
    dfd.promise().then(() => {
      wrapper = wrapper.update();
      expect(wrapper.find('.alert.danger')).to.have.length(1);
    }).then(done, done);
  });

  it("handles random errors gracefully", (done) => {
    let logs = stubLogs();
    let props = getProps();
    let dfd = stubApi(props.Svcs, "postToken");
    let wrapper = mount(<EventLanding {...props} actionOnMount="keep" />);
    dfd.reject(new Error("Whoops"));
    dfd.promise().catch(() => {
      wrapper = wrapper.update();
      expect(wrapper.find('.alert.danger')).to.have.length(1);
      expect(logs.error.called).to.be.true;
    }).then(done, done);
  });

  it("shows error messages for mismatched keep token", (done) => {
    let logs = stubLogs();
    let props = getProps();
    let dfd = stubApi(props.Svcs, "postToken");
    let wrapper = mount(<EventLanding {...props} actionOnMount="keep" />);
    dfd.resolve({ token_value: ["Unconfirm_timebomb_event", {
      event, confirm_uid: "123"
    }]});
    dfd.promise().then(() => {
      wrapper = wrapper.update();
      expect(wrapper.find('.alert.danger')).to.have.length(1);
      expect(logs.error.called).to.be.true;
    }).then(done, done);
  });

  it("shows error messages for mismatched cancel token", (done) => {
    let logs = stubLogs();
    let props = getProps();
    let dfd = stubApi(props.Svcs, "postToken");
    let wrapper = mount(<EventLanding {...props} actionOnMount="cancel" />);
    dfd.resolve({ token_value: ["Confirm_timebomb_event", {
      event, confirm_uid: "123"
    }]});
    dfd.promise().then(() => {
      wrapper = wrapper.update();
      expect(wrapper.find('.alert.danger')).to.have.length(1);
      expect(logs.error.called).to.be.true;
    }).then(done, done);
  });

  it("renders event upon token returning one", (done) => {
    let props = getProps();
    let dfd = stubApi(props.Svcs, "postToken");
    let wrapper = mount(<EventLanding {...props} actionOnMount="keep" />);
    dfd.resolve({ token_value: ["Confirm_timebomb_event", {
      event, confirm_uid: "123"
    }]});
    dfd.promise().then(() => {
      wrapper = wrapper.update();
      expect(wrapper.find('.event-info')).to.have.length(1);
      expect(wrapper.text()).to.include(event.title!);
    }).then(done, done);
  });

  it("allows user to toggle token to cancel", (done) => {
    let props = getProps();
    let stub = props.Svcs.Api.postToken = Sinon.stub();
    let p1 = Promise.resolve({ token_value: ["Confirm_timebomb_event", {
      event, confirm_uid: "123"
    }]});
    stub.onFirstCall().returns(p1)
    stub.onSecondCall().returns(new Promise(() => null));

    let wrapper = mount(<EventLanding {...props} actionOnMount="keep" />);
    p1.then(() => {
      wrapper = wrapper.update();
      let unchecked = wrapper
        .find("input[type=\"radio\"]")
        .findWhere((c) => !c.prop("checked"));
      expect(unchecked).to.have.length(1);

      // Reset stub because we made one API call already
      stub.reset();
      stub.returns(new Promise(() => null));
      unchecked.simulate("change", { target: { checked: true }});
      expectCalledWith(stub, props.tokens.cancel);
    }).then(done, done);
  });

  it("allows user to toggle token to keep", (done) => {
    let props = getProps();
    let stub = props.Svcs.Api.postToken = Sinon.stub();
    let p1 = Promise.resolve({ token_value: ["Unconfirm_timebomb_event", {
      event, confirm_uid: "123"
    }]});
    stub.onFirstCall().returns(p1)
    stub.onSecondCall().returns(new Promise(() => null));

    let wrapper = mount(<EventLanding {...props} actionOnMount="cancel" />);
    p1.then(() => {
      wrapper = wrapper.update();
      let unchecked = wrapper
        .find("input[type=\"radio\"]")
        .findWhere((c) => !c.prop("checked"));
      expect(unchecked).to.have.length(1);

      // Reset stub because we made one API call already
      stub.reset();
      stub.returns(new Promise(() => null));
      unchecked.simulate("change", { target: { checked: true }});
      expectCalledWith(stub, props.tokens.keep);
    }).then(done, done);
  });
});