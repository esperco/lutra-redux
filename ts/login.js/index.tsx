/*
  Landing page for timebomb-only product -- login not required. Doesn't use
  Redux or do anything fancy. Can use email tokens to confirm or delete an
  event.
*/

// LESS
require("less/login.less");

// HTML files
require("html/login.html");


////////////////////////////////////////

/// <reference path="../../node_modules/@types/mocha/index.d.ts" />
/// <reference path="../../config/config.d.ts" />
import * as Conf from "config";
import * as React from "react";
import * as ReactDOM from "react-dom";
import * as Log from "../lib/log";
import Analytics from "../lib/analytics";
import Api from "../lib/api";
import LocalStore from "../lib/local-store";
import { Nav } from "../lib/routing"
import { GenericErrorMsg } from "../text/error-text";
import init from "./login-init";
import LoginContainer from "./LoginContainer";

/*
  Helper initialization
*/
const Svcs = { Analytics, Api, Nav, LocalStore };

Log.init(Object.assign({
  logTrace: Conf.production
}, Conf));

Api.init(Conf);


// Render login container after we initialize based on URL params
init(location, Svcs)
  .catch((err) => ({ error: GenericErrorMsg }))
  .then((props) => ReactDOM.render(
    <LoginContainer {...props} Svcs={Svcs} />,
    document.getElementById("main")
  ));



