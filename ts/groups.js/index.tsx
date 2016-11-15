/*
  This is the entry point and main file for groups.js. It should log
  in our user (if possible), retrieve initial data, and render a view 
  for a group.
*/

/// <reference path="../../node_modules/@types/mocha/index.d.ts" />
/// <reference path="../../config/config.d.ts" />
import { logLevel, logTag, production } from "config";
import * as _ from "lodash";
import * as React from "react";
import * as ReactDOM from "react-dom";
import { createStore, compose } from "redux";
import * as Log from "../lib/log";

// Components
import App from "../components/App";
import Hello from "../components/Hello";
import NotFound from "../components/NotFound";
import Loading from "../components/Loading";
import GroupEvents from "./GroupEvents";
import Setup from "./Setup";

// Store Types
import { State, Action } from "./types";
import * as Counter from "../states/counter";
import * as Name from "../states/name";
import * as Routing from "../lib/routing";
import * as Routes from "./routes";
import initState from "./init-state";

// Check for redux dev tools extension
declare var devToolsExtension: any;

let store = createStore(
  // Reducers
  function(state: State, action: Action) {
    switch (action.type) {
      case "INCR":
        return Counter.incrReducer(state, action);
      case "NAME_CHANGE":
        return Name.nameChangeReducer(state, action);
      case "ROUTE":
        return Routing.routeReducer(state, action);
    }
    return state;
  }, 

  // Initial state
  initState(),
  
  // Hook up to extension (if applicable)
  compose(devToolsExtension ? devToolsExtension() : (f: any) => f));

// Init misc modules
Log.init({ 
  minLevel: logLevel,
  logTag,
  logTrace: production
});

// Render view(s) hooked up to store
store.subscribe(() => {
  let state = store.getState();
  let dispatch = (a: Action) => store.dispatch(a);
  let props = { state, dispatch };

  ReactDOM.render(
    <App>
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

// This starts the router
Routes.init((a) => store.dispatch(a));

// Initial dispatch
store.dispatch({ type: "" })
