/*
  Wrapper around Sinon's test sandbox -- this sandbox should auto-restore
  after each test, so use it instead of Sinon directly when mocking
  things that might persist between tests.
*/
import * as _ from "lodash";
import * as sinon from "sinon";
export var sandbox: sinon.SinonSandbox = sinon.sandbox.create();
export default sandbox;

// Reset sandbox after each test
afterEach(function() {
  sandbox.restore();

  // Restore glob objects too
  let glob: any = typeof global === "undefined" ? window : global;
  for (let name in restores) {
    glob[name] = restores[name];
  }
  restores = {};
});

// List of resets for stub below
let restores: Record<string, any> = {};

/*
  We may be running in a NodeJS context for testing. So need to decare global
  so we can stub out things like LocalStorage and cookies and other stuff
*/
declare var global: any;

// Helper function that stubs browser objects that may not exist in NodeJS
export function stub(path: string|string[], newObj: any) {
  if (path.length === 0) {
    throw new Error("Need non-empty path");
  }

  let glob: any = typeof global === "undefined" ? window : global;
  let parents = typeof path === "string" ? [] : path.slice(0, -1);
  let child = typeof path === "string" ? path : path[path.length - 1];
  let lastParent = glob;

  // Keep first level copy of original thing to restore
  let restoreName = typeof path === "string" ? path : path[0];
  restores[restoreName] = restores[restoreName] || glob[restoreName];
  if (glob[restoreName]) {
    glob[restoreName] = _.clone(glob[restoreName]);
  }

  // Ensure we have enough objects to get to where we want to go
  _.each(parents, (name) => {
    lastParent = lastParent[name] = lastParent[name] || {};
  });

  // Replace with new object
  lastParent[child] = newObj;
}

export function spyWithCallback(obj: any, method: string, cbs: {
  pre?: () => void;
  post?: () => void;
} = {}) {
  let orig: Function = obj[method];
  let newFn = function(this: any) {
    cbs.pre && cbs.pre();
    let ret = orig.apply(this, arguments);
    cbs.post && cbs.post();
    return ret;
  }
  return sandbox.stub(obj, method).callsFake(newFn);
}
