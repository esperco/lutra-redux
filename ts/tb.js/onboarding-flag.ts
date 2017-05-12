/*
  Get and set an onboarding flag.
*/
import { LocalStoreSvc } from "../lib/local-store";

const localStoreFlag = "tb-onboarding";

export function get(svcs: LocalStoreSvc) {
  let { LocalStore } = svcs;
  return !!LocalStore.get(localStoreFlag);
}

export function set(svcs: LocalStoreSvc) {
  let { LocalStore } = svcs;
  LocalStore.set(localStoreFlag, true);
}

export function unset(svcs: LocalStoreSvc) {
  let { LocalStore } = svcs;
  LocalStore.remove(localStoreFlag);
}
