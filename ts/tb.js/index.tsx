/*
  This is the entry point and main file for /tb. It should log
  in our user (if possible) and render timebomb-only UI for a single team
  (the user's exec team)
*/

// HTML files
require("html/tb.html");


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
import * as Paths from "./paths";
import { store, dispatch, getState } from "./store";

// Components
import App from "../components/App";
import Header from "../components/AppHeader";
import NotFound from "../components/NotFound";
import Loading from "../components/Loading";
import ScrollContainer from "../components/ScrollContainer";
import CalSetup from "../containers/CalSetup";
import SlackSetup from "../containers/SlackSetup";
import Events from "./TBEvents";

// Store Types
import { LoggedInState, DispatchFn } from "./types";
import * as DataStatus from "../states/data-status";
import * as ErrorMsg from "../states/error-msg";
import * as Login from "../lib/login";
import * as Routing from "../lib/routing";
import * as Routes from "./routes";

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

  ReactDOM.render(
    <App {...appProps} >
      <Header active="agenda-check" {...props} />
      <ScrollContainer className="content"
        scrollKey={getScrollKey(props.state)}
        onScrollChange={(direction) => props.dispatch({
          type: "SCROLL", direction
        })}>
        <MainView {...props} />
      </ScrollContainer>
    </App>,
    document.getElementById("main")
  );
});

// Scroll key is used to reset scrollTop on container
function getScrollKey(state: LoggedInState) {
  if (state.route) {
    let route = state.route;
    switch (route.page) {
      case "Events":
        return route.period.start;
      default:
        return route.page;
    }
  }
  return;
}

// View routing
function MainView(props: {
  state: LoggedInState;
  dispatch: DispatchFn;
  Svcs: typeof Svcs;
  Conf: typeof Conf;
}) {
  if (props.state.route) {
    switch(props.state.route.page) {
      case "Redirect":
        return <div className="spinner" />;
      case "Events":
        let { page: p1, ...eventProps } = props.state.route;
        return <Events {...props} {...eventProps} />;
      case "CalSetup":
        let { page: p2, ...calSetupProps } = props.state.route;
        return <CalSetup
          {...props} {...calSetupProps}
          next={Paths.activate.href({})}
        />;
      case "SlackSetup":
        let { page: p3, ...slackSetupProps } = props.state.route;
        return <SlackSetup
          {...props} {...slackSetupProps}
          className="slack-agenda-setup"
          next={Paths.events.href({})}
        />;
      case "NotFound":
        return <NotFound />;
    }
  }
  return <Loading />;
}


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
Login.init(dispatch, Conf, Svcs).then((info) => {
  // Things that should be initialized after login go here

  // This starts the router
  Routes.init({ dispatch, getState, Svcs, Conf });
});
