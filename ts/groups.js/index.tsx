/// <reference path="../../node_modules/@types/mocha/index.d.ts" />
/// <reference path="../../config/config.d.ts" />
import { name } from "config";
import * as React from "react";
import * as ReactDOM from "react-dom";

import Hello from "../components/Hello";

ReactDOM.render(
  <Hello name={name} />,
  document.getElementById("main")
);
