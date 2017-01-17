import * as React from 'react';
import { expect } from "chai";
import { shallow } from 'enzyme';
import * as Sinon from 'sinon';
import { expectCalledWith } from "../lib/expect-helpers";
import TagList from './TagList';
import { OrderedSet } from "../lib/util";

describe('<TagList />', () => {
  const choice1 = {
    original: "Yellow Green",
    normalized: "yellow green"
  };
  const choice2 = {
    original: "Mellow Yellow",
    normalized: "mellow yellow"
  };
  const choice3 = {
    original: "Green Tea",
    normalized: "green tea"
  };

  const choices = new OrderedSet([choice1, choice2, choice3]);
  const selected = new OrderedSet([choice1, choice2]);
  var toggleSpy: Sinon.SinonSpy;

  function getTagList() {
    toggleSpy = Sinon.spy();
    return shallow(<TagList
      choices={choices}
      selected={selected}
      onAdd={() => null}
      onToggle={toggleSpy}
      filterFn={() => [undefined, []]}
      buttonText="Hello"
    />);
  }

  it("renders a tag for each selected choice", () => {
    expect(getTagList().find('.tag')).to.have.length(2);
  });

  it("renders button that removes a choice when clicked for each choice",
  () => {
    let buttons = getTagList().find('button');
    expect(buttons).to.have.length(2); // Technically 3 if we count dropdown
                                       // but we're shallow rendering
    buttons.at(0).simulate('click');
    expectCalledWith(toggleSpy, choice1, false);
  });
});