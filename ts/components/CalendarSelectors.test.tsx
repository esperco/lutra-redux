import * as React from 'react';
import { expect } from 'chai';
import { shallow } from 'enzyme';
import { sandbox } from "../lib/sandbox";
import { expectCalledWith } from '../lib/expect-helpers';
import * as Sinon from 'sinon';

import { DaySelector, RangeSelector } from './CalendarSelectors';

describe("<RangeSelector />", () => {
  it("renders each week of a month", () => {
    let wrapper = shallow(<RangeSelector
      initialView={new Date("2016-10-10")}
      onChange={() => null}
    />);

    // 6 weeks because we're extra days at first and last week
    let weeks = wrapper.find('.week');
    expect(weeks).to.have.length(6);
    for (let i = 0; i < weeks.length; i += 1) {
      expect(weeks.at(i).find('.day')).to.have.length(7);
    }
  });

  it("applies different classes to in-month and out-of-month", () => {
    let wrapper = shallow(<RangeSelector
      initialView={new Date("2016-10-10")}
      onChange={() => null}
    />);
    let days = wrapper.find('.day');

    // 9/30 -> out of month
    let endSept = days.at(5);
    expect(endSept.text()).to.equal("30"); // Sanity check
    expect(endSept.hasClass("in-month")).to.be.false;

    let startOct = days.at(6);
    expect(startOct.text()).to.equal("1");
    expect(startOct.hasClass("in-month")).to.be.true;

    let midOct = days.at(15);
    expect(midOct.text()).to.equal("10");
    expect(startOct.hasClass("in-month")).to.be.true;

    let endOct = days.at(36);
    expect(endOct.text()).to.equal("31");
    expect(endOct.hasClass("in-month")).to.be.true;

    let startNov = days.at(37);
    expect(startNov.text()).to.equal("1");
    expect(startNov.hasClass("in-month")).to.be.false;
  });

  it("applies a special class to today", () => {
    sandbox.useFakeTimers((new Date("2016-10-5")).getTime());
    let wrapper = shallow(<RangeSelector
      initialView={new Date("2016-10-10")}
      onChange={() => null}
    />);
    let days = wrapper.find('.day.in-month');

    let today = days.at(4);
    expect(today.text()).to.equal("5"); // Sanity check
    expect(today.hasClass("today")).to.be.true;

    let tomorrow = days.at(5);
    expect(tomorrow.hasClass("today")).to.be.false;
  });

  it("decrements view when prev button is pressed", () => {
    let wrapper = shallow(<RangeSelector
      initialView={new Date("2016-10-10")}
      onChange={() => null}
    />);
    let prevButton = wrapper.find('header button').first();
    prevButton.simulate('click');

    wrapper.update();
    expect(wrapper.find('h4').text()).to.equal('Sep 2016');
    expect(wrapper.find('.day.in-month')).to.have.length(30);
  });

  it("increments view when next button is pressed", () => {
    let wrapper = shallow(<RangeSelector
      initialView={new Date("2016-10-10")}
      onChange={() => null}
    />);
    let prevButton = wrapper.find('header button').last();
    prevButton.simulate('click');

    wrapper.update();
    expect(wrapper.find('h4').text()).to.equal('Nov 2016');
    expect(wrapper.find('.day.in-month')).to.have.length(30);
  });

  it("marks selected days as active", () => {
    // Initialize dates to midnight or else might end up getting UTC
    // when testing on a non-UTC system
    let wrapper = shallow(<RangeSelector
      initialView={new Date("2016-10-10")}
      value={[new Date("2016-10-03 0:0"), new Date("2016-10-05 0:0")]}
      onChange={() => null}
    />);
    let days = wrapper.find('.day.in-month');
    expect(days.at(1).hasClass('active')).to.be.false;

    expect(days.at(2).hasClass('active')).to.be.true;
    expect(days.at(2).hasClass('start')).to.be.true;

    expect(days.at(3).hasClass('active')).to.be.true;
    expect(days.at(3).hasClass('start')).to.be.false;
    expect(days.at(3).hasClass('end')).to.be.false;

    expect(days.at(4).hasClass('active')).to.be.true;
    expect(days.at(4).hasClass('end')).to.be.true;

    expect(days.at(5).hasClass('active')).to.be.false;
  });

  it("marks days between start and hover as active", () => {
    let wrapper = shallow(<RangeSelector
      initialView={new Date("2016-10-10")}
      value={[new Date("2016-10-03 0:0"), new Date("2016-10-05 0:0")]}
      onChange={() => null}
    />);
    let days = wrapper.find('.day.in-month');
    days.at(3).find('button').simulate('click');
    days.at(5).find('button').simulate('mouseenter');

    wrapper.update();
    days = wrapper.find('.day.in-month');
    expect(days.at(2).hasClass('active')).to.be.false;

    expect(days.at(3).hasClass('active')).to.be.true;
    expect(days.at(3).hasClass('start')).to.be.true;

    expect(days.at(4).hasClass('active')).to.be.true;
    expect(days.at(4).hasClass('start')).to.be.false;
    expect(days.at(4).hasClass('end')).to.be.false;

    expect(days.at(5).hasClass('active')).to.be.true;
    expect(days.at(5).hasClass('end')).to.be.true;

    expect(days.at(6).hasClass('active')).to.be.false;
  });

  it("returns a date range after selection", () => {
    let changeSpy = Sinon.spy();
    let wrapper = shallow(<RangeSelector
      initialView={new Date("2016-10-10")}
      onChange={changeSpy}
    />);
    let days = wrapper.find('.day.in-month');

    days.at(2).find('button').simulate('click');
    expect(changeSpy.called).to.be.false;

    days.at(8).find('button').simulate('click');
    expectCalledWith(changeSpy, [
      new Date("2016-10-3 0:0"),
      new Date("2016-10-9 0:0")
    ]);
  });

  it("does not return a reversed date range", () => {
    let changeSpy = Sinon.spy();
    let wrapper = shallow(<RangeSelector
      initialView={new Date("2016-10-10")}
      onChange={changeSpy}
    />);
    let days = wrapper.find('.day.in-month');
    days.at(8).find('button').simulate('click');
    days.at(2).find('button').simulate('click');
    expect(changeSpy.called).to.be.false;
  });

  it("allows single-day date range", () => {
    let changeSpy = Sinon.spy();
    let wrapper = shallow(<RangeSelector
      initialView={new Date("2016-10-10")}
      onChange={changeSpy}
    />);
    let days = wrapper.find('.day.in-month');

    days.at(2).find('button').simulate('click');
    expect(changeSpy.called).to.be.false;

    days.at(2).find('button').simulate('click');
    expectCalledWith(changeSpy, [
      new Date("2016-10-3 0:0"),
      new Date("2016-10-3 0:0")
    ]);
  });

  it("allows min date specification", () => {
    let wrapper = shallow(<RangeSelector
      initialView={new Date("2016-10-10 0:0")}
      onChange={() => null}
      minDate={new Date("2016-10-11 0:0")}
    />);
    let days = wrapper.find('.day.in-month');
    expect(days).to.have.length(31); // Sanity check

    expect(days.at(9).prop("disabled")).to.be.true;   // 10th
    expect(days.at(10).prop("disabled")).to.be.false; // 11th
    expect(days.at(11).prop("disabled")).to.be.false; // 12th
  });

  it("allows max date specification", () => {
    let wrapper = shallow(<RangeSelector
      initialView={new Date("2016-10-10 0:0")}
      onChange={() => null}
      maxDate={new Date("2016-10-11 0:0")}
    />);
    let days = wrapper.find('.day.in-month');
    expect(days).to.have.length(31); // Sanity check

    expect(days.at(9).prop("disabled")).to.be.false;  // 10th
    expect(days.at(10).prop("disabled")).to.be.false; // 11th
    expect(days.at(11).prop("disabled")).to.be.true;  // 12th
  });

  it("disables decrement if it takes us entirely past minDate", () => {
    let wrapper = shallow(<RangeSelector
      initialView={new Date("2016-10-10 0:0")}
      onChange={() => null}
      minDate={new Date("2016-10-11 0:0")}
    />);
    let prevButton = wrapper.find('header button').first();
    expect(prevButton.prop("disabled")).to.be.true;
    let nextButton = wrapper.find('header button').last();
    expect(nextButton.prop("disabled")).to.be.false;
  });

  it("allows decrement to month of minDate", () => {
    let wrapper = shallow(<RangeSelector
      initialView={new Date("2016-11-10 0:0")}
      onChange={() => null}
      minDate={new Date("2016-10-01 0:0")}
    />);
    let prevButton = wrapper.find('header button').first();
    expect(prevButton.prop("disabled")).to.be.false;
  });

  it("disables increment if it takes us entirely past maxDate", () => {
    let wrapper = shallow(<RangeSelector
      initialView={new Date("2016-10-10 0:0")}
      onChange={() => null}
      maxDate={new Date("2016-10-31 0:0")}
    />);
    let prevButton = wrapper.find('header button').first();
    expect(prevButton.prop("disabled")).to.be.false;
    let nextButton = wrapper.find('header button').last();
    expect(nextButton.prop("disabled")).to.be.true;
  });

  it("allows increment to month of maxDate", () => {
    let wrapper = shallow(<RangeSelector
      initialView={new Date("2016-09-10 0:0")}
      onChange={() => null}
      minDate={new Date("2016-10-11 0:0")}
    />);
    let nextButton = wrapper.find('header button').last();
    expect(nextButton.prop("disabled")).to.be.false;
  });
});

describe("<DaySelector />", () => {
  it("applies different classes to in-month and out-of-month", () => {
    let wrapper = shallow(<DaySelector
      value={new Date("2016-10-10")}
      onChange={() => null}
    />);
    let days = wrapper.find('.day');

    // 9/30 -> out of month
    let endSept = days.at(5);
    expect(endSept.text()).to.equal("30"); // Sanity check
    expect(endSept.hasClass("in-month")).to.be.false;

    let startOct = days.at(6);
    expect(startOct.text()).to.equal("1");
    expect(startOct.hasClass("in-month")).to.be.true;

    let midOct = days.at(15);
    expect(midOct.text()).to.equal("10");
    expect(startOct.hasClass("in-month")).to.be.true;

    let endOct = days.at(36);
    expect(endOct.text()).to.equal("31");
    expect(endOct.hasClass("in-month")).to.be.true;

    let startNov = days.at(37);
    expect(startNov.text()).to.equal("1");
    expect(startNov.hasClass("in-month")).to.be.false;
  });

  it("applies a special class to today", () => {
    sandbox.useFakeTimers((new Date("2016-10-5")).getTime());
    let wrapper = shallow(<DaySelector
      value={new Date("2016-10-10")}
      onChange={() => null}
    />);
    let days = wrapper.find('.day.in-month');

    let today = days.at(4);
    expect(today.text()).to.equal("5"); // Sanity check
    expect(today.hasClass("today")).to.be.true;

    let tomorrow = days.at(5);
    expect(tomorrow.hasClass("today")).to.be.false;
  });

  it("marks selected date as active", () => {
    let wrapper = shallow(<DaySelector
      value={new Date("2016-10-10 0:0")}
      onChange={() => null}
    />);
    let days = wrapper.find('.day.in-month');
    let selected = days.at(9);
    expect(selected.text()).to.equal("10"); // Sanity check
    expect(selected.hasClass("active")).to.be.true;

    let nextDate = days.at(10);
    expect(nextDate.hasClass("active")).to.be.false;
  });

  it("returns new date after selection", () => {
    let changeSpy = Sinon.spy();
    let wrapper = shallow(<DaySelector
      value={new Date("2016-10-10")}
      onChange={changeSpy}
    />);
    let days = wrapper.find('.day.in-month');
    days.at(2).find('button').simulate('click');
    expectCalledWith(changeSpy, new Date("2016-10-3 0:0"));
  });

  it("allows min date specification", () => {
    let wrapper = shallow(<DaySelector
      value={new Date("2016-10-10 0:0")}
      onChange={() => null}
      minDate={new Date("2016-10-11 0:0")}
    />);
    let days = wrapper.find('.day.in-month');
    expect(days).to.have.length(31); // Sanity check

    expect(days.at(9).prop("disabled")).to.be.true;   // 10th
    expect(days.at(10).prop("disabled")).to.be.false; // 11th
    expect(days.at(11).prop("disabled")).to.be.false; // 12th
  });

  it("allows max date specification", () => {
    let wrapper = shallow(<DaySelector
      value={new Date("2016-10-10 0:0")}
      onChange={() => null}
      maxDate={new Date("2016-10-11 0:0")}
    />);
    let days = wrapper.find('.day.in-month');
    expect(days).to.have.length(31); // Sanity check

    expect(days.at(9).prop("disabled")).to.be.false;  // 10th
    expect(days.at(10).prop("disabled")).to.be.false; // 11th
    expect(days.at(11).prop("disabled")).to.be.true;  // 12th
  });
});