import * as React from "react";
import { expect } from "chai";
import { mount } from 'enzyme';
import GroupCalcDisplay from "./GroupCalcDisplay";
import Waypoint from "../components/Waypoint";
import { testLabel } from "../fakes/labels-fake";
import { stubRAF } from "../fakes/stubs";
import * as ApiT from "../lib/apiT";
import { LabelSet } from "../lib/event-labels";

describe("<GroupCalcDisplay />", () => {
  const label1 = testLabel("Label 1");
  const label2 = testLabel("Label 2");
  const labels = new LabelSet([label1, label2]);
  const props = {
    results: "FETCHING" as "FETCHING",
    labels,
    labelHrefFn: (l?: ApiT.LabelInfo) => l ?
                    "/url/" + l.normalized : "/unlabeled-url"
  }
  const results = {
    seconds: 10800,
    eventCount: 3,
    peopleSeconds: 21600,
    groupPeopleSeconds: 10800,
    labelResults: {
      [label1.normalized]: {
        seconds: 7200,
        eventCount: 2,
        peopleSeconds: 14400,
        groupPeopleSeconds: 7200
      },
      [label2.normalized]: {
        seconds: 3600,
        eventCount: 1,
        peopleSeconds: 7200,
        groupPeopleSeconds: 3600
      }
    },
    unlabeledResult: {
      seconds: 3600,
      eventCount: 1,
      peopleSeconds: 7200,
      groupPeopleSeconds: 3600
    }
  };

  it("renders calculation message if results not ready", () => {
    let wrapper = mount(<GroupCalcDisplay {...props} />);
    expect(wrapper.find('.calculating')).to.have.length(1);
    expect(wrapper.find(Waypoint)).to.have.length(0);
    expect(wrapper.find('.stats')).to.have.length(0);
    expect(wrapper.find('.bar-chart')).to.have.length(0);
  });

  it("hides chart data by default", () => {
    let wrapper = mount(<GroupCalcDisplay
      {...props}
      results={results}
    />);
    expect(wrapper.find(Waypoint)).to.have.length(1);
    expect(wrapper.find('.stats')).to.have.length(0);
    expect(wrapper.find('.bar-chart')).to.have.length(0);
  });


  function mountAndActivate(thisProps=props, thisResults=results) {
    stubRAF();
    let wrapper = mount(<GroupCalcDisplay
      {...thisProps}
      results={thisResults}
    />);
    let waypoint = wrapper.find(Waypoint);
    waypoint.prop('onEnter')({
      currentPosition: "inside",
      previousPosition: "below"
    });
    wrapper.update();
    return wrapper;
  }

  it("shows charts + stats once Waypoint is activated", () => {
    let wrapper = mountAndActivate();
    expect(wrapper.find('.stats')).to.have.length(1);
    expect(wrapper.find('.bar-chart')).to.have.length(1);
  });

  it("renders links in bar chart for each label", () => {
    let wrapper = mountAndActivate();
    let links = wrapper.find('.bar-chart a')
    expect(links).to.have.length(2);
    expect(links.at(0).prop('href')).to.equal("/url/" + label1.normalized);
    expect(links.at(1).prop('href')).to.equal("/url/" + label2.normalized);
  });

  it("renders proportional bars for each label", () => {
    let wrapper = mountAndActivate();
    let links = wrapper.find('.bar-chart .bar')
    expect(links).to.have.length(2);
    expect(links.at(0).prop('style').width).to.equal('100%');
    expect(links.at(1).prop('style').width).to.equal('50%');
  });

  it("calculates percentages of total for each label", () => {
    let wrapper = mountAndActivate();
    let links = wrapper.find('.bar-chart .number')
    expect(links).to.have.length(2);
    expect(links.at(0).text()).to.include('(67%)');
    expect(links.at(1).text()).to.include('(33%)');
  });

  it("renders stats but not chart if only unlabeled", () => {
    let wrapper = mountAndActivate(props, {
      ...results,
      ...results.unlabeledResult,
      labelResults: {}
    });
    expect(wrapper.find('.stats')).to.have.length(1);
    expect(wrapper.find('.bar-chart')).to.have.length(0);
  });

  it("doesn't choke if label set is empty", () => {
    let wrapper = mountAndActivate({
      ...props,
      labels: new LabelSet([])
    });
    expect(wrapper.find('.stats')).to.have.length(1);
    expect(wrapper.find('.bar-chart')).to.have.length(1);
  });
});
