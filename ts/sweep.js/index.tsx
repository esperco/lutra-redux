/*
  Landing page for timebomb-only product -- login not required. Doesn't use
  Redux or do anything fancy. Can use email tokens to confirm or delete an
  event.
*/

// This causes Webpack to load everything in the assets dir during the build
require.context("assets", true, /.*$/);

// LESS
require("less/sweep.less");

// HTML files
require("html/sweep.html");

////////////////////////////////////////

/// <reference path="../../node_modules/@types/mocha/index.d.ts" />
/// <reference path="../../config/config.d.ts" />
import * as Conf from "config";
import * as _ from "lodash";
import * as React from "react";
import * as ReactDOM from "react-dom";
import * as Log from "../lib/log";
import Analytics from "../lib/analytics";
import Api from "../lib/api";
import { Nav } from "../lib/routing"
import { getParamByName } from "../lib/util";
import { GenericErrorMsg } from "../text/error-text";
import { LandingCTAButton } from "../text/timebomb";
import EventLanding from "./EventLanding";

/*
  Helper initialization
*/
let Svcs = { Analytics, Api, Nav };

Log.init(_.extend({
  logTrace: Conf.production
}, Conf));

Api.init(Conf);


/*
  Only render component if we have tokens to work with.
*/
let action = getParamByName("action", location.search);
let tokens = {
  keep: getParamByName("keep", location.search),
  cancel: getParamByName("cancel", location.search)
};

if (action || tokens.keep || tokens.cancel) {
  let cta = document.getElementById("cta-btn");
  if (cta) {
    cta.textContent = LandingCTAButton;
  }

  let component =
    (action === "keep" || action ==="cancel") && tokens.keep && tokens.cancel ?
    <EventLanding
      actionOnMount={action}
      tokens={tokens}
      Svcs={Svcs}
    /> : <div className="alert danger">
      { GenericErrorMsg }
    </div>;

  ReactDOM.render(<div className="container">
    <div className="panel">
      { component }
    </div>
  </div>, document.getElementById("token-ui"));
}

