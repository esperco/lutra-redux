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
import * as Log from "../lib/log";
import Analytics from "../lib/analytics";
import Api from "../lib/api";
import LocalStore from "../lib/local-store";
import { store, dispatch as oldDispatch, getState } from "./store";

// Components
import App from "../components/App";
import NotFound from "../components/NotFound";
import Loading from "../components/Loading";
import GroupEvents from "./GroupEvents";
import GroupHeader from "./GroupHeader";
import Setup from "./Setup";

// Store Types
import { LoggedInState, State, Action, PostTaskFn, DispatchFn } from "./types";
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

Log.init(_.extend({
  logTrace: Conf.production
}, Conf));


/*
  Worker initialization.
*/
declare var GroupWorker: Worker; // Defined in groups.js
const postTask: PostTaskFn = function(task) {
  if (typeof GroupWorker !== "undefined") {
    GroupWorker.postMessage(task);
  }
}

// Wrap dispatch function to also post to worker.
let dispatch: DispatchFn = function(a) {
  let ret = oldDispatch(a);
  postTask({
    type: "UPDATE_STORE",
    dispatch: a
  });
  return ret;
}

/*
  Listen to worker for actions to update store. Note that since dispatch is
  wrapped, this means the worker's store is also updated by this dispatch.
  It's a little inefficient but simplifies keeping the stores in sync.
*/
if (typeof GroupWorker !== "undefined") {
  GroupWorker.addEventListener("message", (e) => {
    let action: Action|undefined = e.data;
    if (action && action.type) {
      dispatch(action);
    }
  });
}


// Render view(s) hooked up to store
store.subscribe(() => {
  let gotState = store.getState();

  // Wait until logged in to render
  if (! gotState.login) {
    return;
  }
  let state = gotState as LoggedInState;
  let props = { state, dispatch, Svcs, Conf };

  ReactDOM.render(
    <App {...props} >
      <GroupHeader {...props} />
      <div className="content">
        <MainView {...props} />
      </div>
    </App>,
    document.getElementById("main")
  );
});

// View routing
function MainView(props: {
  state: State,
  dispatch: (a: Action) => Action;
  Svcs: typeof Svcs
}) {
  if (props.state.route) {
    switch(props.state.route.page) {
      case "GroupEvents":
        return <GroupEvents {...props} {...props.state.route} />;
      case "Setup":
        return <Setup {...props} />;
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
  }
}, Conf));

// This starts the login process
Login.init(dispatch, Conf, Svcs).then((info) => {
  // Things that should be initialized after login go here

  // This starts the router
  Routes.init(dispatch, getState, Svcs);

  // Load groups data
  initGroupsData(info, { dispatch, Svcs });
});
