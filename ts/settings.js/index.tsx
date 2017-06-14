/*
  This is the entry point and main file for /tb. It should log
  in our user (if possible) and render timebomb-only UI for a single team
  (the user's exec team)
*/

// HTML files
require("html/settings.html");


//////////////////////////////////////

/// <reference path="../../node_modules/@types/mocha/index.d.ts" />
/// <reference path="../../config/config.d.ts" />
import * as Conf from "config";
import * as _ from "lodash";
import * as React from "react";
import * as ReactDOM from "react-dom";
import * as Log from "../lib/log";
import Analytics from "../lib/analytics";
import Api from "../lib/api";
import LocalStore from "../lib/local-store";
import * as Routing from "../lib/routing";
import { store, dispatch, getState } from "./store";

// Components
import App from "../components/App";
import Header from "../components/AppHeader";
import ScrollContainer from "../components/ScrollContainer";
import Settings from "./Settings";

// Handlers
import * as Teams from "../handlers/teams";
import * as TeamCals from "../handlers/team-cals";
import * as TeamPrefs from "../handlers/team-prefs";


// Store Types
import { LoggedInState } from "./types";
import * as DataStatus from "../states/data-status";
import * as ErrorMsg from "../states/error-msg";
import * as Login from "../lib/login";

/*
  Helper initialization
*/
let Svcs = {
  Analytics, Api, LocalStore,
  Nav: Routing.Nav
};

Log.init(_.extend({
  logTrace: Conf.production
}, Conf));

// Render view(s) hooked up to store
store.subscribe(() => {
  let gotState = store.getState();

  // Wait until logged in to render
  if (! gotState.login) {
    return;
  }
  let state = gotState as LoggedInState;
  let appProps = { state, dispatch };
  let props = { state, dispatch, Svcs, Conf };

  // Check for exec team to show settings for (redirect otherwise while
  // we try to init)
  let execTeam = Teams.getSelfExecTeam({ state });

  ReactDOM.render(
    <App {...appProps} >
      <Header {...props} />
      <ScrollContainer className="content"
        onScrollChange={(direction) => props.dispatch({
          type: "SCROLL", direction
        })}>
        { execTeam ?
          <Settings teamId={execTeam.teamid} {...props} /> :
          <div className="spinner" /> }
      </ScrollContainer>
    </App>,
    document.getElementById("main")
  );
});

/* Redux-Dependent Initialization  */

// Sets API prefixes -- needs dispatch for error handling
Api.init(_.extend<typeof Conf>({
  startHandler: DataStatus.dataStartHandler(dispatch),
  successHandler: DataStatus.dataEndHandler(dispatch),
  errorHandler: function(id: string, err: Error) {
    DataStatus.dataEndHandler(dispatch)(id);
    ErrorMsg.errorHandler(dispatch)(id, err);
    Login.loginRequiredHandler(Conf, Svcs)(err);
  }
}, Conf));

// This starts the login process
Login.init(dispatch, Conf, Svcs).then(async (info) => {
  // Things that should be initialized after login go here

  // Ensure exec team
  let deps = { state: getState(), dispatch, Svcs }
  let team = await Teams.ensureSelfExecTeam(deps);

  // Fetch info for user's team
  TeamCals.fetchAvailableCalendars(team.teamid, deps);
  TeamCals.fetchSelectedCalendars(team.teamid, deps);
  TeamPrefs.fetch(team.teamid, deps);
});
