import * as React from "react";
import { expect } from "chai";
import { shallow, mount } from 'enzyme';
import BarChart from "../components/BarChart";
import Waypoint from "../components/Waypoint";
import { testLabel } from "../fakes/labels-fake";
import * as ApiT from "../lib/apiT";
import { LabelSet } from "../lib/event-labels";
import GroupCalcDisplay, { Stats, LabelChart } from "./GroupCalcDisplay";

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
    let wrapper = shallow(<GroupCalcDisplay {...props} />);
    expect(wrapper.find('.calculating')).to.have.length(1);
    expect(wrapper.find(Stats)).to.have.length(0);
    expect(wrapper.find(LabelChart)).to.have.length(0);
  });

  function mountAndActivate(thisProps=props, thisResults=results) {
    let wrapper = shallow(<GroupCalcDisplay
      {...thisProps}
      results={thisResults}
    />);
    let waypoint = wrapper.find(Waypoint);
    waypoint.prop('onEnter')!({
      waypointTop: 0,
      viewportTop: 0,
      viewportBottom: 0,
      currentPosition: "inside",
      previousPosition: "below"
    });
    wrapper.update();
    return wrapper;
  }

  it("shows charts + stats once Waypoint is activated", () => {
    let wrapper = mountAndActivate();
    expect(wrapper.find(Stats)).to.have.length(1);
    expect(wrapper.find(LabelChart)).to.have.length(1);
  });

  it("renders links in bar chart for each label", () => {
    let wrapper = mountAndActivate();
    let barChart = wrapper.find(LabelChart).dive().find(BarChart).dive();
    let links = barChart.find('a');
    expect(links).to.have.length(2);
    expect(links.at(0).prop('href')).to.equal("/url/" + label1.normalized);
    expect(links.at(1).prop('href')).to.equal("/url/" + label2.normalized);
  });

  it("renders proportional bars for each label", () => {
    let wrapper = mountAndActivate();
    let barChart = wrapper.find(LabelChart).dive().find(BarChart).dive();
    let bars = barChart.find('.bar')
    expect(bars).to.have.length(2);
    expect(bars.at(0).prop('style')!.width).to.equal('100%');
    expect(bars.at(1).prop('style')!.width).to.equal('50%');
  });

  it("calculates percentages of total for each label", () => {
    let wrapper = mountAndActivate();
    let barChart = wrapper.find(LabelChart).dive().find(BarChart).dive();
    let numbers = barChart.find('.number')
    expect(numbers).to.have.length(2);
    expect(mount(numbers.get(0)).text()).to.include('67%');
    expect(mount(numbers.get(1)).text()).to.include('33%');
  });

  it("renders stats but not chart if only unlabeled", () => {
    let wrapper = mountAndActivate(props, {
      ...results,
      ...results.unlabeledResult,
      labelResults: {}
    });
    expect(wrapper.find(Stats)).to.have.length(1);
    expect(wrapper.find(LabelChart)).to.have.length(0);
  });

  it("doesn't choke if label set is empty", () => {
    let wrapper = mountAndActivate({
      ...props,
      labels: new LabelSet([])
    });
    expect(wrapper.find(Stats)).to.have.length(1);
    expect(wrapper.find(LabelChart)).to.have.length(1);
  });
});
