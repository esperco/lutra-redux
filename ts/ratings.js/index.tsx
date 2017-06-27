/*
  Landing page for ratings-only product -- login not required. Doesn't use
  Redux or do anything fancy. Can use email tokens to confirm or delete an
  event.
*/

// HTML files
require("html/ratings.html");

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
import RatingsLanding, { ActionOnMount } from "./RatingsLanding";

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
let token = getParamByName("token", location.search);
if (token) {
  let onDone = () => location.search = "";

  // Handle email button options
  let actionOnMount: ActionOnMount|undefined;
  let stars = parseInt(getParamByName("stars", location.search));
  let didnt_attend = !!getParamByName("didnt_attend", location.search);
  let is_organizer = !!getParamByName("is_organizer", location.search);
  if (!isNaN(stars) && stars >= 1 && stars <= 5) {
    actionOnMount = { stars };
  } else if (didnt_attend) {
    actionOnMount = { didnt_attend };
  } else if (is_organizer) {
    actionOnMount = { is_organizer };
  }

  let component = token ? <RatingsLanding
      actionOnMount={actionOnMount}
      onDone={onDone}
      token={token}
      Svcs={Svcs}
    /> : <div className="alert danger">
      { GenericErrorMsg }
    </div>;

  /*
    Use ModalBase instead of Modal b/c we don't need a header.
    onClose is no-op because we don't need to be able to close this modal
    the normal way (let RatingsLanding's onDone handle it).
  */
  ReactDOM.render(<ModalBase onClose={() => null}>
    <div className="modal">
      <div className="panel">
        { component }
      </div>
    </div>
  </ModalBase>, document.getElementById("main"));
}

