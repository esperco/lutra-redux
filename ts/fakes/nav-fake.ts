import { NavSvc } from "../lib/routing";

function navFakeFactory() {
  let svc: NavSvc = {
    Nav: {
      queryHashes: {},
      go: function(path: string) {}
    }
  };
  return svc;
}

export default navFakeFactory;
