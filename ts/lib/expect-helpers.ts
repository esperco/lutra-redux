import { expect } from 'chai';
import * as Sinon from 'sinon';
import * as _ from 'lodash';
import * as inspect from 'util-inspect';

function stringify(x: any): string {
  return inspect(x, { depth: null });
}

// Expect list to contain item
export function expectDeepIncludes<T>(lst: T[], item: T) {
  let x = _.find(lst, (i) => _.isEqual(i, item));
  let msg = `${stringify(lst)} does not include ${stringify(item)}`;
  expect(x, msg).to.not.be.undefined;
}

export function expectNotDeepIncludes<T>(lst: T[], item: T) {
  let x = _.find(lst, (i) => _.isEqual(i, item));
  let msg = `${stringify(lst)} includes ${stringify(item)}`;
  expect(x, msg).to.be.undefined;
}

// Expect spy to have been called with argument
export function expectCalledWith(spy: Sinon.SinonSpy, ...args: any[]) {
  let msg = _.isEmpty(spy.args) ?
    `Spy was not called` :
    `Spy called with: ${stringify(spy.args)}, ` +
    `not ${stringify(args)}`;
  expect(spy.calledWith(...args), msg).to.be.true;
}