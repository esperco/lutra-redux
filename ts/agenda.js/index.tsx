/*
  Landing page for timebomb-only product -- login not required. Doesn't use
  Redux or do anything fancy. Can use email tokens to confirm or delete an
  event.
*/

// HTML files
require("html/agenda.html");

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
import { ModalBase } from "../components/Modal";
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
  let onDone = () => location.search = "";
  let component =
    (action === "keep" || action ==="cancel") && tokens.keep && tokens.cancel ?
    <EventLanding
      actionOnMount={action}
      onDone={onDone}
      tokens={tokens}
      Svcs={Svcs}
    /> : <div className="alert danger">
      { GenericErrorMsg }
    </div>;

  /*
    Use ModalBase instead of Modal b/c we don't need a header.
    onClose is no-op because we don't need to be able to close this modal
    the normal way (let EventLanding's onDone handle it).
  */
  ReactDOM.render(<ModalBase onClose={() => null}>
    <div className="modal">
      <div className="panel">
        { component }
      </div>
    </div>
  </ModalBase>, document.getElementById("main"));
}

