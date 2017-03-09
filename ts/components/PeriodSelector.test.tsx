import * as React from 'react';
import { expect } from 'chai';
import { shallow, mount } from 'enzyme';
import { expectCalledWith } from '../lib/expect-helpers';
import * as Sinon from 'sinon';
import * as moment from 'moment';
import { stubRAF } from "../fakes/stubs";

import PeriodSelector from './PeriodSelector';
import Dropdown from './Dropdown';
import { RangeSelector } from './CalendarSelectors';

describe("<PeriodSelector />", () => {

  // Helper function to get sub-component wrappers
  function getSubs(elm: JSX.Element, doMount=false) {
    let periodSelector = doMount ? mount(elm) : shallow(elm);

    // Get dropdown first
    let dropdown = periodSelector.find(Dropdown);
    expect(dropdown).to.have.length(1);

    // RangeSelector is inside dropdown menu
    let menu = shallow(dropdown.prop('menu'));
    let rangeSelector = menu.find(RangeSelector);
    expect(rangeSelector).to.have.length(1);

    // Get buttons too
    let firstButton = periodSelector.find('button').first();
    let lastButton = periodSelector.find('button').last();

    return {
      dropdown,
      menu,
      rangeSelector,
      periodSelector,
      firstButton,
      lastButton
    };
  }

  it("renders a <RangeSelector /> with the right month", () => {
    let { rangeSelector } = getSubs(<PeriodSelector
      // Value is Sept to Oct 2016
      value={{ interval: "month", start: 560, end: 561 }}
      onChange={() => null}
    />);

    // Initial view is first month in selection
    let initialView = rangeSelector.prop('initialView') as Date;
    expect(moment(initialView).isSame(new Date("2016-09-01"), "month"))
      .to.be.true;

    // Actual value is what was passed
    let selectedValue = rangeSelector.prop('value');
    expect(selectedValue).to.deep.equal([
      new Date("2016-09-01"),
      new Date("2016-10-31T23:59:59.999")
    ]);
  });

  it("calls onChange callback when rangeSelector changes value", () => {
    let changeSpy = Sinon.spy();
    let { rangeSelector } = getSubs(<PeriodSelector
      // Value is Sept to Oct 2016
      value={{ interval: "month", start: 560, end: 561 }}
      onChange={changeSpy}
    />);

    rangeSelector.prop('onChange')([
      new Date("2016-11-1"),
      new Date("2016-11-30")
    ]);
    expectCalledWith(changeSpy, {
      interval: "month",
      start: 562,
      end: 562
    });
  });

  it("closes dropdown on selection", () => {
    stubRAF();
    let { periodSelector, rangeSelector } = getSubs(<PeriodSelector
      // Value is Sept to Oct 2016
      value={{ interval: "month", start: 560, end: 561 }}
      onChange={() => null}
    />, true); // Need to mount so Dropdown ref set

    let instance = periodSelector.instance() as PeriodSelector;
    expect(instance._dropdown).to.be.instanceOf(Dropdown);

    let closeSpy = Sinon.spy(instance._dropdown, 'close');
    rangeSelector.prop('onChange')([
      new Date("2016-11-1"),
      new Date("2016-11-30")
    ]);
    expect(closeSpy.called).to.be.true;
  });

  it("calls onChange when preset selected", () => {
    stubRAF();
    let changeSpy = Sinon.spy();
    let { menu } = getSubs(<PeriodSelector
      // Value is Sept to Oct 2016
      value={{ interval: "month", start: 560, end: 561 }}
      onChange={changeSpy}
      presets={[{
        displayAs: "This Month",
        value: { interval: "month", start: 565, end: 565 }
      }]}
    />, true); // Need to mount so Dropdown ref set

    let preset = menu.find('.presets').find('button');
    expect(preset.text()).to.equal('This Month');

    preset.simulate('click');
    expectCalledWith(changeSpy, {
      interval: "month",
      start: 565, end: 565
    });
  });

  it("closes dropdown on preset selection", () => {
    stubRAF();
    let { periodSelector, menu } = getSubs(<PeriodSelector
      // Value is Sept to Oct 2016
      value={{ interval: "month", start: 560, end: 561 }}
      onChange={() => null}
      presets={[{
        displayAs: "This Month",
        value: { interval: "month", start: 565, end: 565 }
      }]}
    />, true); // Need to mount so Dropdown ref set

    let instance = periodSelector.instance() as PeriodSelector;
    expect(instance._dropdown).to.be.instanceOf(Dropdown);

    let preset = menu.find('.presets').find('button');

    let closeSpy = Sinon.spy(instance._dropdown, 'close');
    preset.simulate('click');
    expect(closeSpy.called).to.be.true;
  });

  it("increments forward when next button is clicked", () => {
    let changeSpy = Sinon.spy();
    let { lastButton } = getSubs(<PeriodSelector
      // Value is Sept to Oct 2016
      value={{ interval: "month", start: 560, end: 561 }}
      onChange={changeSpy}
    />);

    lastButton.simulate('click');
    expectCalledWith(changeSpy, {
      interval: "month",
      start: 562,
      end: 563
    });
  });

  it("increments backwards when prev button is clicked", () => {
    let changeSpy = Sinon.spy();
    let { firstButton } = getSubs(<PeriodSelector
      // Value is Sept to Oct 2016
      value={{ interval: "month", start: 560, end: 561 }}
      onChange={changeSpy}
    />);

    firstButton.simulate('click');
    expectCalledWith(changeSpy, {
      interval: "month",
      start: 558,
      end: 559
    });
  });
});