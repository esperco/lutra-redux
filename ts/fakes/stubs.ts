/*
  Stubs for common things that need stubbing
*/

import { sandbox, stub as stubGlobal } from "../lib/sandbox";
import * as Log from "../lib/log";

export function stubLogs() {
  let ret = {
    debug: sandbox.stub(Log, "debug"),
    info: sandbox.stub(Log, "info"),
    warn: sandbox.stub(Log, "warn"),
    error: sandbox.stub(Log, "error")
  };

  // Get aliases too
  sandbox.stub(Log, "d", ret.debug);
  sandbox.stub(Log, "i", ret.info);
  sandbox.stub(Log, "w", ret.warn);
  sandbox.stub(Log, "e", ret.error);

  return ret;
}

// window.requestAnimationFrame
export function stubRAF() {
  let raf = stubGlobal(["window", "requestAnimationFrame"],
  function(fn: () => any) {
    setTimeout(fn, 0);
  });
  return raf;
}