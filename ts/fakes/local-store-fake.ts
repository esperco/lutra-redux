/*
  Returns a fake LocalStore for testing -- all functions currently just
  return empty promises.
*/
import { LocalStoreSvc } from "../lib/local-store";

function localStoreFactory(initData: {[index: string]: any}): LocalStoreSvc {
  var data = { ...initData };
  return { LocalStore: {
    get(k) {
      return data[k];
    },
    set: function(k, v) {
      data[k] = v;
    },
    remove: function(k) {
      delete data[k];
    },
    clear: function() {
      data = {};
    }
  } };
}

export default localStoreFactory;
