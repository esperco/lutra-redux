/*
  Module for queueing API calls that need to proceed sequentially (e.g. in
  order to avoid race conditions)..

  Built around the Queue class. The Queue class is initialized with a function
  that takes a list of things to process and returns a promise with a new list.
  That list is concatenated with anything enqueued since the last processor
  start and passed in again to the processor function. Loops until list is
  empty.
*/

import { Deferred } from './util';

interface ProcessFn<T> {
  (state: T[]): Promise<T[]>;
}

export class Queue<T> {
  queue: T[];
  deferred: Deferred<void>;

  constructor(public processFn: ProcessFn<T>) {
    this.queue = [];
  }

  reset() {
    this.queue = [];
    delete this.deferred;
  }

  enqueue(item: T): Promise<void> {
    this.queue.push(item);
    this.start();
    return this.deferred.promise();
  }

  start() {
    if (!this.deferred || this.deferred.state !== "pending") {
      this.deferred = new Deferred<void>();
      this.advance();
    }
  }

  advance() {
    let processQueue = this.queue;
    this.queue = [];
    this.processFn(processQueue).then((newQueue) => {
      // Combine new queue with anything added since then
      this.queue = newQueue.concat(this.queue);
      if (this.queue.length > 0) {
        this.advance(); // Still stuff, process again
      } else {
        this.deferred && this.deferred.resolve(); // Done
      }
    }).catch((err) => {
      // Error -> reset old queue
      this.queue = processQueue.concat(this.queue);
      this.deferred && this.deferred.reject(err);
    });
  }
}


/*
  Boilerplate for maintaining a map of keys (e.g. groupIds) to separate queues
*/
interface MapProcessFn<T> {
  (id: string, state: T[]): Promise<T[]>;
}

export class QueueMap<T> {
  queues: Record<string, Queue<T>>;

  constructor(public mapProcessFn: MapProcessFn<T>) {
    this.reset();
  }

  reset() {
    this.queues = {};
  }

  get(id: string) {
    return (this.queues[id] = this.queues[id] ||
      new Queue<T>((q) => this.mapProcessFn(id, q)));
  }
}

export default Queue;