import * as React from "react";
import { expect } from "chai";
import { mount } from 'enzyme';
import * as Sinon from "sinon";
import RatingsLanding from "./RatingsLanding";
import analyticsSvcFactory from "../fakes/analytics-fake";
import navSvcFactory from "../fakes/nav-fake";
import { apiSvcFactory } from "../fakes/api-fake";
import makeEvent from "../fakes/events-fake";
import { stubLogs, stubRAF } from "../fakes/stubs";
import * as ApiT from "../lib/apiT";
import { expectCalledWith } from "../lib/expect-helpers";
import { stub as stubGlobal, whenCalled } from "../lib/sandbox";

describe("<RatingsLanding />", () => {
  const uid = "my-uid";
  const event = makeEvent({
    id: "id-1",
    title: "My Event Title"
  });
  const feedback: ApiT.GuestEventFeedback = { uid };
  const token = "my-token";

  function getProps() {
    let analytics = analyticsSvcFactory();
    let api = apiSvcFactory();
    let nav = navSvcFactory();
    return {
      token,
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
    stubRAF();
    stubGlobal("location", location);
  });

  it("posts token on mount", () => {
    let props = getProps();
    let spy = Sinon.spy(props.Svcs.Api, "postRatingsToken");
    mount(<RatingsLanding {...props} />);
    expectCalledWith(spy, token, {});
  });

  it("posts token with rating on mount if specified", () => {
    let props = getProps();
    let spy = Sinon.spy(props.Svcs.Api, "postRatingsToken");
    mount(<RatingsLanding {...props} actionOnMount={{ stars: 3 }} />);
    expectCalledWith(spy, token, { stars: 3 });
  });

  it("posts token with didnt_attend on mount if specified", () => {
    let props = getProps();
    let spy = Sinon.spy(props.Svcs.Api, "postRatingsToken");
    mount(<RatingsLanding {...props} actionOnMount={{ didnt_attend: true }} />);
    expectCalledWith(spy, token, { didnt_attend: true });
  });

  it("posts token with is_organizer on mount if specified", () => {
    let props = getProps();
    let spy = Sinon.spy(props.Svcs.Api, "postRatingsToken");
    mount(<RatingsLanding {...props} actionOnMount={{ is_organizer: true }} />);
    expectCalledWith(spy, token, { is_organizer: true });
  });

  it("calls Analytics page on mount", () => {
    let props = getProps();
    let spy = Sinon.spy(props.Svcs.Analytics, "page");
    mount(<RatingsLanding {...props} actionOnMount={{ stars: 4 }} />);
    expectCalledWith(spy, location.pathname, { action: { stars: 4 } });
  });

  it("renders placeholders while waiting for response", () => {
    let props = getProps();
    let wrapper = mount(<RatingsLanding {...props} />);
    expect(wrapper.find('.placeholder')).to.have.length.greaterThan(0);
  });

  it("handles Invalid_token error gracefully", async () => {
    let props = getProps();
    props.Svcs.Api.postRatingsToken =
      () => Promise.resolve("Invalid_token" as "Invalid_token");

    let next = whenCalled(RatingsLanding.prototype, "postToken");
    let wrapper = mount(<RatingsLanding {...props} />);
    await next();

    wrapper = wrapper.update();
    expect(wrapper.find('.alert.danger')).to.have.length(1);
  });

  it("handles Expired_token error gracefully", async () => {
    let props = getProps();
    props.Svcs.Api.postRatingsToken =
      () => Promise.resolve("Expired_token" as "Expired_token");

    let next = whenCalled(RatingsLanding.prototype, "postToken");
    let wrapper = mount(<RatingsLanding {...props} />);
    await next();

    wrapper = wrapper.update();
    expect(wrapper.find('.alert.danger')).to.have.length(1);
  });

  it("handles random errors gracefully", async () => {
    let logs = stubLogs();
    let props = getProps();
    props.Svcs.Api.postRatingsToken = () => Promise.reject(new Error("Whoops"));

    let next = whenCalled(RatingsLanding.prototype, "postToken");
    let wrapper = mount(<RatingsLanding {...props} />);
    await next();

    wrapper = wrapper.update();
    expect(wrapper.find('.alert.danger')).to.have.length(1);
    expect(logs.error.called).to.be.true;
  });

  it("shows error messages for mismatched token", async () => {
    let logs = stubLogs();
    let props = getProps();
    props.Svcs.Api.postRatingsToken = () => Promise.resolve({
      token_value: ["Unconfirm_timebomb_event", {
        event, uid: "123"
      }] as ["Unconfirm_timebomb_event", ApiT.ConfirmTimebombInfo]
    });

    let next = whenCalled(RatingsLanding.prototype, "postToken");
    let wrapper = mount(<RatingsLanding {...props} />);
    await next();

    wrapper = wrapper.update();
    expect(wrapper.find('.alert.danger')).to.have.length(1);
    expect(logs.error.called).to.be.true;
  });

  it("renders event upon token returning one", async () => {
    let props = getProps();
    props.Svcs.Api.postRatingsToken = () => Promise.resolve({
      token_value: ["Feedback", {
        event, uid, feedback
      }] as ["Feedback", ApiT.EventForGuest]});

    let next = whenCalled(RatingsLanding.prototype, "postToken");
    let wrapper = mount(<RatingsLanding {...props} />);
    await next();

    wrapper = wrapper.update();
    expect(wrapper.find('.event-info')).to.have.length(1);
    expect(wrapper.text()).to.include(event.title!);
  });

  it("renders existing event feedback upon token returning one", async () => {
    let props = getProps();
    props.Svcs.Api.postRatingsToken = () => Promise.resolve({
      token_value: ["Feedback", {
        event, uid, feedback: { ...feedback, stars: 3, notes: "Hello" }
      }] as ["Feedback", ApiT.EventForGuest]});

    let next = whenCalled(RatingsLanding.prototype, "postToken");
    let wrapper = mount(<RatingsLanding {...props} />);
    await next();

    wrapper = wrapper.update();

    let stars = wrapper.find('.stars');
    expect(stars).to.have.length(1);
    expect(stars.text()).to.equal("\u2605\u2605\u2605\u2606\u2606");

    let notes = wrapper.find('textarea');
    expect(notes.prop('value')).to.equal("Hello");
  });

  it("allows user to change ratings", async () => {
    let props = getProps();
    props.Svcs.Api.postRatingsToken = () => Promise.resolve({
      token_value: ["Feedback", {
        event, uid, feedback
      }] as ["Feedback", ApiT.EventForGuest]});
    let spy = Sinon.spy(props.Svcs.Api, "postRatingsToken");

    let next = whenCalled(RatingsLanding.prototype, "postToken");
    let wrapper = mount(<RatingsLanding {...props} />);

    // Wait for fetch action to post
    await next();
    wrapper = wrapper.update();
    let stars = wrapper.find(".stars button");
    expect(stars).to.have.length(5);

    // Toggle radio
    stars.at(0).simulate("click");
    expectCalledWith(spy, token, { stars: 1 });
  });
});