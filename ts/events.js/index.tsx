/*
  This is the entry point and main file for /events. It should log
  in our user (if possible), retrieve initial data, and either render
  a view for the event or redirect as appropriate.
*/

// LESS
require("less/_variables.less");

// HTML files
require("html/events.html");


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
import { store, dispatch, getState } from "./store";

// Components
import App from "../components/App";
import NotFound from "../components/NotFound";
import Loading from "../components/Loading";
import EventView from "./EventView";

// Store Types
import { LoggedInState, DispatchFn } from "./types";
import * as DataStatus from "../states/data-status";
import * as ErrorMsg from "../states/error-msg";
import * as Login from "../lib/login";
import * as Routing from "../lib/routing";
import * as Routes from "./routes";

// Handlers
import { initData as initGroupsData } from "../handlers/groups";

/*
  Helper initialization
*/
let Svcs = {
  Analytics, Api, LocalStore,
  Nav: Routing.Nav
};

Log.init({
  ...Conf,
  logTrace: Conf.production
});

// Render view(s) hooked up to store
store.subscribe(() => {
  let gotState = store.getState();

  // Wait until logged in to render
  if (! gotState.login) {
    return;
  }
  let state = gotState as LoggedInState;
  let appProps = { state, dispatch };
  let props = { state, dispatch, Svcs };

  ReactDOM.render(
    <App {...appProps} >
      <div className="content">
        <MainView {...props} />
      </div>
    </App>,
    document.getElementById("main")
  );
});

// View routing
function MainView(props: {
  state: LoggedInState;
  dispatch: DispatchFn;
  Svcs: typeof Svcs;
}) {
  if (props.state.route) {
    switch(props.state.route.page) {
      case "Event":
        let { page, ...eventViewProps } = props.state.route;
        return <EventView {...props} {...eventViewProps} />;
      case "NotFound":
        return <NotFound />;
    }
  }
  return <Loading />;
}


/* Redux-Dependent Initialization  */

// Sets API prefixes -- needs dispatch for error handling
Api.init({
  ...Conf,
  startHandler: DataStatus.dataStartHandler(dispatch),
  successHandler: DataStatus.dataEndHandler(dispatch),
  errorHandler: function(id: string, err: Error) {
    DataStatus.dataEndHandler(dispatch)(id);
    ErrorMsg.errorHandler(dispatch)(id, err);
    Login.loginRequiredHandler(Conf, Svcs)(err);
  }
});

// This starts the login process
Login.init(dispatch, Conf, Svcs).then((info) => {
  // Things that should be initialized after login go here

  // This starts the router
  Routes.init({ dispatch, getState, Svcs });

  // Load groups data
  initGroupsData(info, { dispatch, Svcs });
});
