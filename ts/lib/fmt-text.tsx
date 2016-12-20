/*
  Formats simple newline-delimited text and URLs as React components
*/

import * as React from 'react';
import * as _ from 'lodash';

// Converts newlines to paragraphs
export function fmtText(text: string): JSX.Element[] {
  return _(text.split('\n'))
    .filter((text) => text.trim().length > 0)
    .map((text, i) => <p key={i}>{ fmtLinks(text) }</p>)
    .value();
}

// Converts links to anchors
export function fmtLinks(text: string): JSX.Element[] {
  let urlRegex = /(?:(?:https?|ftp)\:)?\/\/[^\s]+[^\s\.\?\!]/g;
  let ret: JSX.Element[] = [];

  let currentIndex = 0;
  let result: RegExpExecArray|null;
  while (result = urlRegex.exec(text)) {
    let match = result[0];
    ret.push(<span key={currentIndex + "a"}>
      { text.slice(currentIndex, result.index) }
    </span>);
    ret.push(<a key={currentIndex + "b"} href={match}>{match}</a>);
    currentIndex = result.index + match.length;
  }

  // Remainder
  ret.push(<span key="last">
    { text.slice(currentIndex, text.length) }
  </span>);

  return ret;
}

export default fmtText;
