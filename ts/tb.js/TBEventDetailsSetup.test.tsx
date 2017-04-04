import * as React from "react";
import { expect } from "chai";
import { shallow } from 'enzyme';
import TBEventDetailsSetup, { TimebombDefault } from "./TBEventDetailsSetup";
import navSvcFactory from "../fakes/nav-fake";
import { apiSvcFactory } from "../fakes/api-fake";
import makeEvent from "../fakes/events-fake";
import makePrefs from "../fakes/team-preferences-fake";
import makeLoginInfo from "../fakes/login-fake";
import { expectCalledWith } from "../lib/expect-helpers";
import { sandbox } from "../lib/sandbox";
import initState from "./init-state";

describe("<TBEventDetailsSetup />", () => {
  const eventId = "event-id";
  const teamId = "team-id";
  const event = makeEvent({ id: eventId });
  const prefs = makePrefs({});

  function getDeps() {
    return {
      dispatch: sandbox.spy(),
      eventId,
      teamId,
      state: {
        ...initState(),
        login: makeLoginInfo({}),
        events: {
          [teamId]: {
            [eventId]: event
          }
        },
        teamPreferences: {
          [teamId]: prefs
        }
      },
      Svcs: {
        ...apiSvcFactory(),
        ...navSvcFactory()
      }
    };
  }

  it("sets has a button that turns tb on by default if unset", () => {
    let deps = getDeps();
    let spy = sandbox.spy(deps.Svcs.Api, "putPreferences");

    let wrapper = shallow(<TBEventDetailsSetup {...deps} />);
    let tbDefault = wrapper.find(TimebombDefault).dive();
    let button = tbDefault.find("button.primary");
    button.simulate("click");
    expectCalledWith(spy, teamId, {
      ...prefs,
      tb: true
    });
  });

  it("does not turn tb on by default if already set to false", () => {
    let deps = getDeps();
    deps.state.teamPreferences[teamId].tb = false;
    let spy = sandbox.spy(deps.Svcs.Api, "putPreferences");

    let wrapper = shallow(<TBEventDetailsSetup {...deps} />);
    let tbDefault = wrapper.find(TimebombDefault).dive();
    let button = tbDefault.find("button.primary");
    button.simulate("click");
    expect(spy.called).to.be.false;
  });
});