import * as React from "react";
import { expect } from "chai";
import { shallow } from "enzyme";
import * as moment from "moment";
import * as Sinon from "sinon";
import { stubRAF } from "../fakes/stubs";
import { expectCalledWith } from '../lib/expect-helpers';
import { fromDates, index } from "../lib/period";
import { sandbox } from "../lib/sandbox";
import { DaySelector } from "./CalendarSelectors";
import Dropdown from "./Dropdown";
import FixedPeriodSelector from "./FixedPeriodSelector";

// Helper function to get sub-component wrappers
function getSubs(elm: JSX.Element) {
  let periodSelector = shallow(elm);

  // Get dropdown first
  let dropdown = periodSelector.find(Dropdown);
  expect(dropdown).to.have.length(1);

  // DAySelector is inside dropdown menu
  let menu = shallow(dropdown.prop('menu'));
  let daySelector = menu.find(DaySelector);
  expect(daySelector).to.have.length(1);

  // Get buttons too
  let firstButton = periodSelector.find('button').first();
  let lastButton = periodSelector.find('button').last();

  return {
    dropdown,
    menu,
    daySelector,
    periodSelector,
    firstButton,
    lastButton
  };
}

describe("<FixedPeriodSelector />", () => {
  it("renders a <DaySelector /> with the right selection", () => {
    let { daySelector } = getSubs(<FixedPeriodSelector
      value={fromDates(new Date("2016-09-05 0:0"), new Date("2016-09-10 0:0"))}
      onChange={() => null}
    />);

    // Value should match start
    let value = daySelector.prop('value') as Date;
    expect(moment(value).isSame(new Date("2016-09-05 0:0"), "day"))
      .to.be.true;
  });

  it("calls onChange callback with same interval added on to selected date",
  () => {
    let changeSpy = Sinon.spy();
    let { daySelector } = getSubs(<FixedPeriodSelector
      value={fromDates(new Date("2016-09-05 0:0"), new Date("2016-09-10 0:0"))}
      onChange={changeSpy}
    />);

    daySelector.prop('onChange')(new Date("2016-09-11 0:0"))
    expectCalledWith(changeSpy, fromDates(
      new Date("2016-09-11 0:0"),
      new Date("2016-09-16 0:0")
    ));
  });

  it("calls onChange when today selected", () => {
    stubRAF();
    sandbox.useFakeTimers((new Date("2016-11-05 0:0")).getTime());
    let changeSpy = Sinon.spy();
    let { menu } = getSubs(<FixedPeriodSelector
      value={fromDates(new Date("2016-09-05 0:0"), new Date("2016-09-10 0:0"))}
      onChange={changeSpy}
    />);

    let preset = menu.find('.presets').find('button');
    expect(preset.text()).to.equal('Today');

    preset.simulate('click');
    expectCalledWith(changeSpy, fromDates(
      new Date("2016-11-05 0:0"),
      new Date("2016-11-10 0:0")
    ));
  });

  it("increments forward when next button is clicked", () => {
    let changeSpy = Sinon.spy();
    let { lastButton } = getSubs(<FixedPeriodSelector
      value={fromDates(new Date("2016-09-06 0:0"), new Date("2016-09-10 0:0"))}
      onChange={changeSpy}
    />);

    lastButton.simulate('click');
    expectCalledWith(changeSpy, fromDates(
      new Date("2016-09-11 0:0"),
      new Date("2016-09-15 0:0")
    ));
  });

  it("increments backwards when prev button is clicked", () => {
    let changeSpy = Sinon.spy();
    let { firstButton } = getSubs(<FixedPeriodSelector
      value={fromDates(new Date("2016-09-06 0:0"), new Date("2016-09-10 0:0"))}
      onChange={changeSpy}
    />);

    firstButton.simulate('click');
    expectCalledWith(changeSpy, fromDates(
      new Date("2016-09-01 0:0"),
      new Date("2016-09-05 0:0")
    ));
  });

  it("passes minDate and maxDate to DaySelector", () => {
    let bounds = fromDates("day",
      new Date("2016-07-01 0:0"),
      new Date("2016-10-30 0:0"),
    );
    let { daySelector } = getSubs(<FixedPeriodSelector
      value={fromDates(new Date("2016-09-05 0:0"), new Date("2016-09-10 0:0"))}
      onChange={() => null}
      minIndex={bounds.start}
      maxIndex={bounds.end}
    />);
    let minDate = daySelector.prop('minDate') as Date;
    expect(moment(minDate).isSame(new Date("2016-07-01 0:0"), "date"));
    let maxDate = daySelector.prop('maxDate') as Date;
    expect(moment(maxDate).isSame(new Date("2016-10-30 0:0"), "date"));
  });

  it("doesn't allow decrement past minIndex", () => {
    let changeSpy = Sinon.spy();
    let { firstButton } = getSubs(<FixedPeriodSelector
      value={fromDates(new Date("2016-09-05 0:0"), new Date("2016-09-10 0:0"))}
      onChange={changeSpy}
      minIndex={index(new Date("2016-09-01 0:0"), "day")}
    />);

    expect(firstButton.prop('disabled')).to.not.be.true;
    firstButton.simulate('click');
    expectCalledWith(changeSpy, fromDates(
      new Date("2016-09-01 0:0"),
      new Date("2016-09-06 0:0")
    ));
  });

  it("disables decrement button if already at minIndex", () => {
    let changeSpy = Sinon.spy();
    let { firstButton } = getSubs(<FixedPeriodSelector
      value={fromDates(new Date("2016-09-01 0:0"), new Date("2016-09-05 0:0"))}
      onChange={changeSpy}
      minIndex={index(new Date("2016-09-01 0:0"), "day")}
    />);
    expect(firstButton.prop('disabled')).to.be.true;
  });

  it("doesn't allow increment past maxIndex", () => {
    let changeSpy = Sinon.spy();
    let { lastButton } = getSubs(<FixedPeriodSelector
      value={fromDates(new Date("2016-09-05 0:0"), new Date("2016-09-10 0:0"))}
      onChange={changeSpy}
      maxIndex={index(new Date("2016-09-12 0:0"), "day")}
    />);

    expect(lastButton.prop('disabled')).to.not.be.true;
    lastButton.simulate('click');
    expectCalledWith(changeSpy, fromDates(
      new Date("2016-09-07 0:0"),
      new Date("2016-09-12 0:0")
    ));
  });

  it("disables increment button if already at maxIndex", () => {
    let changeSpy = Sinon.spy();
    let { lastButton } = getSubs(<FixedPeriodSelector
      value={fromDates(new Date("2016-09-01 0:0"), new Date("2016-09-05 0:0"))}
      onChange={changeSpy}
      maxIndex={index(new Date("2016-09-05 0:0"), "day")}
    />);
    expect(lastButton.prop('disabled')).to.be.true;
  });
});