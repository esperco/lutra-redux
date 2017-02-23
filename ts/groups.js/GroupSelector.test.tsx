import * as React from 'react';
import { expect } from "chai";
import { mount } from 'enzyme';

import initState from "./init-state";
import GroupSelector from './GroupSelector';

describe("<GroupSelector />", () => {
  it("creates a link with a specified href for each group in login", () => {
    let state = initState();
    state.login = {
      // We just need ids here
      groups: ["id-1", "id-2"]
    } as any;
    state.groupSummaries = {
      "id-1": {
        group_name: "Group 1",
        group_timezone: "America/Los_Angeles",
        group_tb: true,
        group_tb_guests_min: 2,
        group_tb_guests_max: 18
      },
      "id-2": {
        group_name: "Group 2",
        group_timezone: "America/Los_Angeles",
        group_tb: true,
        group_tb_guests_min: 2,
        group_tb_guests_max: 18
      }
    };

    let wrapper = mount(<GroupSelector
      state={state} getHref={(id) => "/link/" + id}
    />);
    expect(wrapper.find('a')).to.have.length(2);

    let link1 = wrapper.find('GroupLink').at(0);
    expect(link1.key()).to.equal("id-1");
    expect(link1.find('a').prop('href')).to.equal("/link/id-1");
    expect(link1.text()).to.equal("Group 1");

    let link2 = wrapper.find('GroupLink').at(1);
    expect(link2.key()).to.equal("id-2");
    expect(link2.find('a').prop('href')).to.equal("/link/id-2");
    expect(link2.text()).to.equal("Group 2");
  });

  it("creates a link with a loading span if summary isn't available yet",
  () => {
    let state = initState();
    state.login = {
      // We just need ids here
      groups: ["id-1", "id-2"]
    } as any;
    state.groupSummaries= {
      "id-1": "FETCHING",
      "id-2": undefined // Intentional bad state
    };

    let wrapper = mount(<GroupSelector
      state={state} getHref={(id) => "/link/" + id}
    />);
    expect(wrapper.find('a')).to.have.length(2);

    let link1 = wrapper.find('GroupLink').at(0);
    expect(link1.key()).to.equal("id-1");
    expect(link1.find('a').prop('href')).to.equal("/link/id-1");
    expect(link1.find('.placeholder')).to.have.length(1);

    let link2 = wrapper.find('GroupLink').at(1);
    expect(link2.key()).to.equal("id-2");
    expect(link2.find('a').prop('href')).to.equal("/link/id-2");
    expect(link1.find('.placeholder')).to.have.length(1);
  });
});