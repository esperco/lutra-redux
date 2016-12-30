import { NavSvc } from "../lib/routing";

function navFakeFactory() {
  let svc: NavSvc = {
    Nav: {
      queryHashes: {},
      go: function(path: string) {},
      reset: function() {},
      refresh: function() {}
    }
  };
  return svc;
}

export default navFakeFactory;
