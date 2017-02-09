import * as React from 'react';
import { shallow } from 'enzyme';
import { expect } from 'chai';
import ColorPicker from "./ColorPicker";

describe("<ColorPicker />", () => {
  it("assigns different valid IDs for each color", () => {
    let wrapper = shallow(<ColorPicker onChange={() => null} />);
    let labels = wrapper.find('label');
    expect(labels.length).to.be.greaterThan(1);

    let knownIds: Record<string, true> = {};
    wrapper.find('label').forEach((l) => {
      let id = l.prop('htmlFor')!;
      if (knownIds[id]) {
        throw new Error(`${id} already exists!`);
      }
      knownIds[id] = true;

      // Check no invalid characters in ID
      expect(id.indexOf('#')).to.equal(-1);
      expect(id.indexOf(' ')).to.equal(-1);

      let input = l.find('input');
      expect(input.prop('id')).to.equal(id);
    });
  });
});