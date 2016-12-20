// import * as React from 'react';
import { shallow } from 'enzyme';
import { expect } from 'chai';
import fmtText from "./fmt-text";

describe("fmtText", () => {
  it("turns newlines into paragraphs", () => {
    let response = fmtText("\n\nHello World\nParagraph 2\n\nParagraph 3");
    expect(response).to.have.length(3);
    expect(shallow(response[0]).is('p'));
    expect(shallow(response[0]).text()).equals('Hello World')
    expect(shallow(response[1]).is('p'));
    expect(shallow(response[1]).text()).equals('Paragraph 2')
    expect(shallow(response[2]).is('p'));
    expect(shallow(response[2]).text()).equals('Paragraph 3')
  });

  it("turns hrefs into anchor links", () => {
    let response = fmtText(
      "Hello World. Pleae visit https://example.com/ for more details.\n" +
      "https://example.com/stuff is better than http://test.com/stuff."
    );
    expect(response).to.have.length(2);

    let p1 = shallow(response[0]);
    expect(p1.text()).equals(
      "Hello World. Pleae visit https://example.com/ for more details."
    );
    let p1Links = p1.find('a');
    expect(p1Links).to.have.length(1);
    expect(p1Links.prop('href')).to.equal('https://example.com/');
    expect(p1Links.text()).to.equal('https://example.com/');

    let p2 = shallow(response[1]);
    expect(p2.text()).equals(
      "https://example.com/stuff is better than http://test.com/stuff."
    );
    let p2Links = p2.find('a');
    expect(p2Links).to.have.length(2);
    expect(p2Links.at(0).prop('href')).to.equal('https://example.com/stuff');
    expect(p2Links.at(0).text()).to.equal('https://example.com/stuff');
    expect(p2Links.at(1).prop('href')).to.equal('http://test.com/stuff');
    expect(p2Links.at(1).text()).to.equal('http://test.com/stuff');
  });
});