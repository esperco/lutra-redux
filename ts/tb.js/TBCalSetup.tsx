import * as React from "react";
import * as Text from "../text/team";
import { Props, CalendarsSelector } from "./TBSettings";

export const TBCalSetup = (props: Props) => {
  return <div className="container">
    <h3>{ Text.CalHeading }</h3>
    <p className="description">
      { Text.CalDescription }
    </p>

    <div className="panel">
      <CalendarsSelector {...props} />
    </div>
  </div>;
};
