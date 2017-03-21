/*
  This is the entry point and main file for /groups. It should log
  in our user (if possible), retrieve initial data, and render a view
  for a group.
*/

// This causes Webpack to load everything in the assets dir during the build
require.context("assets", true, /.*$/);

// Web worker
if ((self as any).Worker) {
  /*
    Require as web worker.

    Note that pending https://github.com/webpack/worker-loader/pull/29/files,
    the name attribute is ignored and we get a "main.worker" file instead.
    This is fine for now, but if we start using workers for things other than
    groups (i.e. EA/Exec time stats), we'll need to fork the worker-loader
    and patch so it properly names things.
  */
  let Worker = require("worker-loader?name=groups!./worker.ts");
  (window as any).GroupWorker = new Worker();
} else {
  // No web-worker. Unsupported browser.
  let update = confirm(
    "Esper requires a modern browser to function properly. Please " +
    "update your browser before continuing."
  );
  if (update) location.href = "https://outdatedbrowser.com/";
}

// LESS
require("less/_variables.less");

// HTML files
require("html/groups.html");


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
import { store, dispatch as oldDispatch, getState } from "./store";

// Components
import App from "../components/App";
import NotFound from "../components/NotFound";
import Loading from "../components/Loading";
import GroupEvents from "./GroupEvents";
import GroupHeader from "./GroupHeader";
import Setup from "./Setup";
import GeneralSettings from "./GeneralSettings";
import LabelSettings from "./LabelSettings";
import NotificationSettings from "./NotificationSettings";
import MiscSettings from "./MiscSettings";

// Store Types
import { LoggedInState, Action, PostTaskFn, DispatchFn } from "./types";
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
  let props = { state, dispatch, postTask, Svcs, Conf };

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
  state: LoggedInState;
  dispatch: DispatchFn;
  postTask: PostTaskFn;
  Svcs: typeof Svcs;
  Conf: typeof Conf;
}) {
  if (props.state.route) {
    switch(props.state.route.page) {
      case "GroupEvents":
        return <GroupEvents {...props} {...props.state.route} />;
      case "Setup":
        return <Setup {...props} />;
      case "GroupGeneralSettings":
        return <GeneralSettings {...props} {...props.state.route} />;
      case "GroupLabelSettings":
        return <LabelSettings {...props} {...props.state.route} />;
      case "GroupNotificationSettings":
        return <NotificationSettings {...props} {...props.state.route} />;
      case "GroupMiscSettings":
        return <MiscSettings {...props} {...props.state.route} />;
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

  // Sets a flag so other pages know this is a groups user
  Svcs.LocalStore.set("groups", true);

  // This starts the router
  Routes.init({ dispatch, getState, Svcs, postTask, Conf });

  // Load groups data
  initGroupsData(info, { dispatch, Svcs });
});
