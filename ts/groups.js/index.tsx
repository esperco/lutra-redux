/*
  This is the entry point and main file for groups.js. It should log
  in our user (if possible), retrieve initial data, and render a view
  for a group.
*/

/// <reference path="../../node_modules/@types/mocha/index.d.ts" />
/// <reference path="../../config/config.d.ts" />
import * as Conf from "config";
import * as _ from "lodash";
import * as React from "react";
import * as ReactDOM from "react-dom";
import { createStore, compose } from "redux";
import * as Log from "../lib/log";
import Analytics from "../lib/analytics";
import Api from "../lib/api";
import LocalStore from "../lib/local-store";

// Components
import App from "../components/App";
import NotFound from "../components/NotFound";
import Loading from "../components/Loading";
import GroupEvents from "./GroupEvents";
import Setup from "./Setup";

// Store Types
import { State, Action } from "./types";
import * as Counter from "../states/counter";
import * as ErrorMsg from "../states/error-msg";
import * as Name from "../states/name";
import * as Login from "../lib/login";
import * as Routing from "../lib/routing";
import * as Routes from "./routes";
import initState from "./init-state";

// Check for redux dev tools extension
declare var devToolsExtension: any;


/* Helper initialization */

let Svcs = {
  Analytics, Api, LocalStore,
  Nav: Routing.Nav
};

Log.init(_.extend({
  logTrace: Conf.production
}, Conf));


/* Redux Store Initialization */

let store = createStore(
  // Reducers
  function(state: State, action: Action) {
    switch (action.type) {
      case "LOGIN":
        return Login.loginReducer(state, action);
      case "INCR":
        return Counter.incrReducer(state, action);
      case "NAME_CHANGE":
        return Name.nameChangeReducer(state, action);
      case "ROUTE":
        return Routing.routeReducer(state, action);
      case "ADD_ERROR":
      case "RM_ERROR":
        return ErrorMsg.errorReducer(state, action);
      default:
        // Ignore actions that start with @@ (these are built-in Redux
        // actions) but log any other weird ones
        if (action && !(action.type && _.startsWith(action.type, "@@"))) {
          Log.e("Unknown action type", action);
        }
    }
    return state;
  },

  // Initial state
  initState(),

  // Hook up to extension (if applicable)
  compose(devToolsExtension ? devToolsExtension() : (f: any) => f));


/* Hook up main view to store */

// Bound dispatch function
let dispatch: typeof store.dispatch = store.dispatch.bind(store);

// Render view(s) hooked up to store
store.subscribe(() => {
  let state = store.getState();
  let props = { state, dispatch };

  ReactDOM.render(
    <App {...props} >
      <MainView {...props} />
    </App>,
    document.getElementById("main")
  );
});

// View routing
function MainView(props: {
  state: State,
  dispatch: (a: Action) => Action;
}) {
  if (props.state.route) {
    switch(props.state.route.page) {
      case "EVENT_LIST":
        return <GroupEvents {...props} />;
      case "SETUP":
        return <Setup {...props} />;
      case "NOT_FOUND":
        return <NotFound />;
    }
  }
  return <Loading />;
}


/* Redux-Dependent Initialization  */

// Sets API prefixes -- needs dispatch for error handling
Api.init(_.extend({
  errorHandler: ErrorMsg.errorHandler(dispatch)
}, Conf));

// This starts the router
Routes.init(dispatch);

// This starts the login process
Login.init(dispatch, Conf, Svcs).then((info) => {

  // Things that should be initialized after login go here
  // TODO
});
