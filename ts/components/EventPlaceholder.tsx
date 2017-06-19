/*
  Placeholder for when event is loading
*/

import * as React from "react";

export default function EventPlaceholder(p: React.HTMLProps<HTMLDivElement>) {
  return <div {...p}>
    <div className="placeholder" />
    <div className="placeholder" />
    <div className="placeholder" />
  </div>;
}