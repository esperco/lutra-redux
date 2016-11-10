/*
  This is the entry point and main file for groups.js. It should log
  in our user (if possible), retrieve initial data, and render a view 
  for a group.
*/

/// <reference path="../../node_modules/@types/mocha/index.d.ts" />
/// <reference path="../../config/config.d.ts" />
import { name } from "config";
import * as _ from "lodash";
import * as React from "react";
import * as ReactDOM from "react-dom";
import { createStore } from 'redux'

// Components
import App from "../components/App";
import Hello from "../components/Hello";
import GroupEvents from "./GroupEvents";

// Store Types
import { State, Action } from "./types";
import * as Counter from "../states/counter";
import * as Name from "../states/name";

let store = createStore(
  // Reducers
  function(state: State, action: Action) {
    switch (action.type) {
      case "INCR":
        return Counter.incrReducer(state, action);
      case "NAME_CHANGE":
        return Name.nameChangeReducer(state, action);
    }
    return state;
  }, 

  // Load Initial State -- wrap in function because it plays nicer with
  // _.extend typing
  (function(): State {
    let state = Counter.initCounter();
    let state2 = _.extend(state, Name.initName());
    return state2;
  })());

// Render view(s) hooked up to store
store.subscribe(() => {
  let state = store.getState();
  let dispatch = (a: Action) => store.dispatch(a);
  let props = { state, dispatch };
  ReactDOM.render(
    <App>
      <Hello name={name} />
      <GroupEvents {...props} />
    </App>,
    document.getElementById("main")
  );
});

// Initial dispatch
store.dispatch({ type: "" })