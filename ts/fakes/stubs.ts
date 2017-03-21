/*
  Stubs for common things that need stubbing
*/

import * as Sinon from "sinon";
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
  /*
    Sometimes stubTimeouts and stubRAF are called together. This captures
    the original setTimeout (if stubRAF is called first) and uses that to
    stub.
  */
  let originalSetTimeout = setTimeout;
  let raf = Sinon.stub().callsFake(function(fn: () => any) {
    originalSetTimeout(fn, 0);
  });
  stubGlobal(["window", "requestAnimationFrame"], raf);
  return raf;
}

// set + clear timeout -- returns a list of pending timeouts
export function stubTimeouts() {
  let timeouts: {
    fn: Function;
    time: number;
    cleared?: boolean;
  }[] = [];

  let setTimeoutStub = Sinon.stub().callsFake(
    (fn: Function, time: number) => {
      let n = timeouts.length;
      timeouts.push({ fn, time });
      return n;
    }
  );
  stubGlobal("setTimeout", setTimeoutStub);

  let clearTimeoutStub = Sinon.stub().callsFake((n: number) => {
    let t = timeouts[n];
    if (t) {
      t.cleared = true;
    }
  });
  stubGlobal("clearTimeout", clearTimeoutStub);

  return timeouts;
}
