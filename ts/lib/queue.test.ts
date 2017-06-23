import * as _ from "lodash";
import * as Sinon from "sinon";
import { expect } from "chai";
import { Queue, QueueMap, wrapFirst, wrapLast, wrapMerge } from "./queue";
import { expectCalledWith } from "./expect-helpers";

describe("Queue", () => {
  // A spy function used in queue
  let spy = Sinon.spy();

  // Simple queue processor that calls spy with queue then
  // slices two numbers off. Rejects if numList includes NaN.
  let q = new Queue<number>((numList) => {
    spy(numList);
    if (! _.isUndefined(_.find(numList, isNaN))) {
      throw new Error("NaN");
    }
    return Promise.resolve().then(() => numList.slice(2));
  });

  afterEach(() => {
    q.reset();
    spy.reset();
  });

  it("should execute newly queued calls immediately", () => {
    q.enqueue(1);
    expectCalledWith(spy, [1]);
  });

  it("should not process while waiting for promise to resolve", () => {
    q.enqueue(1);
    q.enqueue(2);
    expectCalledWith(spy, [1]);
    expect(spy.callCount).to.equal(1);
  });

  it("should process additional calls until queue clears and " +
     "return a promise when queue is done",
  (done) => {
    q.enqueue(1);
    q.enqueue(2);
    q.enqueue(3);
    q.enqueue(4).then(() => {
      expectCalledWith(spy, [1]);
      expectCalledWith(spy, [2, 3, 4]);
      expectCalledWith(spy, [4]);
    }).then(done, done);
  });

  it("should stop processing if processing function rejects", (done) => {
    q.enqueue(1);
    q.enqueue(2);
    q.enqueue(NaN);
    q.enqueue(4).then(() => {
      throw new Error("Queue should have errored")
    }, () => {
      expectCalledWith(spy, [1]);
      expectCalledWith(spy, [2, NaN, 4]);
      expect(spy.callCount).to.equal(2);
    }).then(done, done);
  });
});

describe("QueueMap", () => {
   // A spy function used in queue
  let spy = Sinon.spy();

  // Simple queue processor that calls spy with queue then
  // slices two numbers off.
  let queue = new QueueMap<number>((id, q) => {
    spy(id, q);
    return Promise.resolve(q.slice(2));
  });

  it("should pass a map key to a queued function", () => {
    queue.get("id1").enqueue(1);
    expectCalledWith(spy, "id1", [1]);
  });

  it("should reuse a queue for any given key", (done) => {
    queue.get("id1").enqueue(1);
    queue.get("id1").enqueue(2);
    queue.get("id1").enqueue(3).then(() => {
      expectCalledWith(spy, "id1", [1]);
      expectCalledWith(spy, "id1", [2, 3]);
    }).then(done, done);
  });

  it("should not reuse a queue for a different key", () => {
    queue.get("id1").enqueue(1);
    queue.get("id2").enqueue(2);

    // Note that we don't wrap in promise -- each of these should process
    // on first try because they're under different keys
    expectCalledWith(spy, "id1", [1]);
    expectCalledWith(spy, "id2", [2]);
  });
});

describe("wrapFirst", () => {
  it("invokes each call in order", async () => {
    let stub = Sinon.stub().callsFake(
      (x: number, y: number) => Promise.resolve(x + y)
    );
    let fn: (x: number, y: number) => Promise<void> = wrapFirst(stub);
    fn(1, 2);
    fn(3, 4);
    let ret = await fn(5, 6);

    expect(stub.callCount).to.equal(3);
    expectCalledWith(stub, 1, 2);
    expectCalledWith(stub, 3, 4);
    expectCalledWith(stub, 5, 6);
    expect(ret).to.equal(11);
  });
});

describe("wrapLast", () => {
  it("invokes first call immediately and then only last call", async () => {
    let stub = Sinon.stub().callsFake(
      (x: number, y: number) => Promise.resolve(x + y)
    );
    let fn: (x: number, y: number) => Promise<void> = wrapLast(stub);
    fn(1, 2);
    fn(3, 4);
    let ret = await fn(5, 6);

    expect(stub.callCount).to.equal(2);
    expectCalledWith(stub, 1, 2);
    expectCalledWith(stub, 5, 6);
    expect(ret).to.equal(11);
  });
});

describe("wrapMerge", () => {
  it("invokes first call immediately and merges remainder", async () => {
    let stub = Sinon.stub().callsFake(
      ({x, y}: { x?: number; y?: number; }) =>
        Promise.resolve((x || 0) + (y || 0))
    );
    let fn: (p: { x?: number; y?: number; }) => Promise<void>
      = wrapMerge(stub);
    fn({ x: 1, y: 2 });
    fn({ x: 3 });
    fn({ y: 4 });
    let ret = await fn({ x: 5 });

    expect(stub.callCount).to.equal(2);
    expectCalledWith(stub, { x: 1, y: 2 });
    expectCalledWith(stub, { x: 5, y: 4 });
    expect(ret).to.equal(9);
  });
});