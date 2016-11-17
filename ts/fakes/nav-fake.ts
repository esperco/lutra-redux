import { NavSvc } from "../lib/routing";

function navFakeFactory() {
  let svc: NavSvc = {
    Nav: { go: function(path: string) {} }
  };
  return svc;
}

export default navFakeFactory;
