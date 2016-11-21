import * as React from 'react';
import * as ReactDOM from 'react-dom';
import * as TestUtils from 'react-addons-test-utils';
import Hello from "./Hello";
import { expect } from "chai";

describe('Hello', () => {
  it('should include the name', () => {
    // Render a checkbox with label in the document
    const hello = TestUtils.renderIntoDocument(
      <Hello name="Joshua" />
    ) as React.Component<any, any>;

    const helloNode = ReactDOM.findDOMNode(hello);
    expect(helloNode.textContent).to.contain('Joshua');
  });
});
