import * as React from "react";
import { expect } from "chai";
import { mount } from 'enzyme';
import * as Sinon from "sinon";
import AgendaLanding from "./AgendaLanding";
import analyticsSvcFactory from "../fakes/analytics-fake";
import navSvcFactory from "../fakes/nav-fake";
import { apiSvcFactory } from "../fakes/api-fake";
import makeEvent from "../fakes/events-fake";
import { stubLogs } from "../fakes/stubs";
import * as ApiT from "../lib/apiT";
import { expectCalledWith } from "../lib/expect-helpers";
import { stub as stubGlobal, whenCalled } from "../lib/sandbox";

describe("<AgendaLanding />", () => {
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
      onDone: () => null,
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
    let spy = Sinon.spy(props.Svcs.Api, "postConfirmToken");
    mount(<AgendaLanding {...props} actionOnMount="keep" />);
    expectCalledWith(spy, tokens.keep, {});
  });

  it("posts cancel token on mount if specified", () => {
    let props = getProps();
    let spy = Sinon.spy(props.Svcs.Api, "postToken");
    mount(<AgendaLanding {...props} actionOnMount="cancel" />);
    expectCalledWith(spy, tokens.cancel);
  });

  it("calls Analytics page on mount", () => {
    let props = getProps();
    let spy = Sinon.spy(props.Svcs.Analytics, "page");
    mount(<AgendaLanding {...props} actionOnMount="keep" />);
    expectCalledWith(spy, location.pathname, { action: "keep" });
  });

  it("renders placeholders while waiting for response", () => {
    let props = getProps();
    let wrapper = mount(<AgendaLanding {...props} actionOnMount="keep" />);
    expect(wrapper.find('.placeholder')).to.have.length.greaterThan(0);
  });

  it("handles Invalid_token error gracefully", async () => {
    let props = getProps();
    props.Svcs.Api.postConfirmToken =
      () => Promise.resolve("Invalid_token" as "Invalid_token");

    let next = whenCalled(AgendaLanding.prototype, "postToken");
    let wrapper = mount(<AgendaLanding {...props} actionOnMount="keep" />);
    await next();

    wrapper = wrapper.update();
    expect(wrapper.find('.alert.danger')).to.have.length(1);
  });

  it("handles Expired_token error gracefully", async () => {
    let props = getProps();
    props.Svcs.Api.postConfirmToken =
      () => Promise.resolve("Expired_token" as "Expired_token");

    let next = whenCalled(AgendaLanding.prototype, "postToken");
    let wrapper = mount(<AgendaLanding {...props} actionOnMount="keep" />);
    await next();

    wrapper = wrapper.update();
    expect(wrapper.find('.alert.danger')).to.have.length(1);
  });

  it("handles random errors gracefully", async () => {
    let logs = stubLogs();
    let props = getProps();
    props.Svcs.Api.postConfirmToken = () => Promise.reject(new Error("Whoops"));

    let next = whenCalled(AgendaLanding.prototype, "postToken");
    let wrapper = mount(<AgendaLanding {...props} actionOnMount="keep" />);
    await next();

    wrapper = wrapper.update();
    expect(wrapper.find('.alert.danger')).to.have.length(1);
    expect(logs.error.called).to.be.true;
  });

  it("shows error messages for mismatched keep token", async () => {
    let logs = stubLogs();
    let props = getProps();
    props.Svcs.Api.postConfirmToken = () => Promise.resolve({
      token_value: ["Unconfirm_timebomb_event", {
        event, uid: "123"
      }] as ["Unconfirm_timebomb_event", ApiT.ConfirmTimebombInfo]
    });

    let next = whenCalled(AgendaLanding.prototype, "postToken");
    let wrapper = mount(<AgendaLanding {...props} actionOnMount="keep" />);
    await next();

    wrapper = wrapper.update();
    expect(wrapper.find('.alert.danger')).to.have.length(1);
    expect(logs.error.called).to.be.true;
  });

  it("shows error messages for mismatched cancel token", async () => {
    let logs = stubLogs();
    let props = getProps();
    props.Svcs.Api.postToken = () => Promise.resolve({
      token_value: ["Confirm_timebomb_event", {
        event, uid: "123"
      }] as ["Confirm_timebomb_event", ApiT.ConfirmTimebombInfo]
    });

    let next = whenCalled(AgendaLanding.prototype, "postToken");
    let wrapper = mount(<AgendaLanding {...props} actionOnMount="cancel" />);
    await next();

    wrapper = wrapper.update();
    expect(wrapper.find('.alert.danger')).to.have.length(1);
    expect(logs.error.called).to.be.true;
  });

  it("renders event upon token returning one", async () => {
    let props = getProps();
    props.Svcs.Api.postConfirmToken = () => Promise.resolve({
      token_value: ["Confirm_timebomb_event", {
        event, uid: "123"
      }] as ["Confirm_timebomb_event", ApiT.ConfirmTimebombInfo]});

    let next = whenCalled(AgendaLanding.prototype, "postToken");
    let wrapper = mount(<AgendaLanding {...props} actionOnMount="keep" />);
    await next();

    wrapper = wrapper.update();
    expect(wrapper.find('.event-info')).to.have.length(1);
    expect(wrapper.text()).to.include(event.title!);
  });

  it("allows user to toggle token to cancel", async () => {
    let props = getProps();
    props.Svcs.Api.postConfirmToken = () => Promise.resolve({
      token_value: ["Confirm_timebomb_event", {
        event, uid: "123"
      }] as ["Confirm_timebomb_event", ApiT.ConfirmTimebombInfo]
    });
    let spy = Sinon.spy(props.Svcs.Api, "postToken");

    let next = whenCalled(AgendaLanding.prototype, "postToken");
    let wrapper = mount(<AgendaLanding {...props} actionOnMount="keep" />);

    // Wait for keep action on mount to post
    await next();
    wrapper = wrapper.update();
    let unchecked = wrapper
      .find("input[type=\"radio\"]")
      .findWhere((c) => !c.prop("checked"));
    expect(unchecked).to.have.length(1);

    // Toggle radio
    unchecked.simulate("change", { target: { checked: true }});
    expectCalledWith(spy, props.tokens.cancel);
  });

  it("allows user to toggle token to keep", async () => {
    let props = getProps();
    props.Svcs.Api.postToken = () => Promise.resolve({
      token_value: ["Unconfirm_timebomb_event", {
        event, uid: "123"
      }] as ["Unconfirm_timebomb_event", ApiT.ConfirmTimebombInfo]
    });
    let spy = Sinon.spy(props.Svcs.Api, "postConfirmToken");

    let next = whenCalled(AgendaLanding.prototype, "postToken");
    let wrapper = mount(<AgendaLanding {...props} actionOnMount="cancel" />);

    // Wait for cancel action on mount to post
    await next();
    wrapper = wrapper.update();
    let unchecked = wrapper
      .find("input[type=\"radio\"]")
      .findWhere((c) => !c.prop("checked"));
    expect(unchecked).to.have.length(1);

    // Toggle radio
    unchecked.simulate("change", { target: { checked: true }});
    expectCalledWith(spy, props.tokens.keep, {});
  });
});