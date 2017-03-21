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
  sandbox.stub(Log, "d").callsFake((...args: any[]) => ret.debug(...args));
  sandbox.stub(Log, "i").callsFake((...args: any[]) => ret.info(...args));
  sandbox.stub(Log, "w").callsFake((...args: any[]) => ret.warn(...args));
  sandbox.stub(Log, "e").callsFake((...args: any[]) => ret.error(...args));

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