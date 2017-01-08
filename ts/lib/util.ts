import * as _ from "lodash";
import * as stringify from "json-stable-stringify";

// Return a random alphanumeric string
export function randomString() {
  return Math.random().toString(36).slice(2);
};

// Returns a rounded string version of a number
export function roundStr(num: number, digits=0) {
  var adjust = Math.pow(10, digits);
  var str = (Math.round(num * adjust) / adjust).toFixed(digits);
  return Number(str).toString();
}

// Recursively freeze object on IE9 and up.
export function deepFreeze<T>(o: T): T {
  // IE9 and below lacks freeze, so bounce out if it doesn't exist
  if (! Object.freeze) {
    return o;
  }

  // Ignore non-objects
  if (typeof o !== "object") {
    return o;
  }

  // Return if already frozen
  if (Object.isFrozen(o)) {
    return o;
  }

  // Shallow freeze of passed object
  Object.freeze(o);

  // Recursively freeze all sub-props -- note that this doesn't freeze
  // functions since typeof function !== "object", but we're presumably
  // not mutating functions
  Object.getOwnPropertyNames(o).forEach(function (prop) {
    if (o.hasOwnProperty(prop) &&
        (<any> o)[prop] !== null) {
      deepFreeze((<any> o)[prop]);
    }
  });

  return o;
};

export function validateEmailAddress(s: string) {
  var re = /\S+@\S+\.\S+/;
  return re.test(s);
}

/* Decode a string encode in hexadecimal */
export function hexDecode(hex: string) {
  var s = "";
  for (var i = 0; i < hex.length; i += 2)
    s += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
  return s;
}

/* Reverse of above -- NB: Does not work with unicode at the moment */
export function hexEncode(orig: string) {
  var hex = '';
  for(var i = 0; i < orig.length; i++) {
    hex += orig.charCodeAt(i).toString(16);
  }
  return hex;
}

/*
  Get value of query string
  http://stackoverflow.com/a/901144
*/
export function getParamByName(name: string, queryStr?: string): string {
  queryStr = queryStr || location.search;
  if (queryStr[0] !== "?") queryStr = "?" + queryStr;
  name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
  var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
      results = regex.exec(queryStr);
  return (results === null ? "" :
    decodeURIComponent(results[1].replace(/\+/g, " ")));
}

/*
  Do something after a short delay. Ensures that only one function is
  pending for any given id.
*/
var delayTimeouts: {[index: string]: number} = {};
export function delayOne(id: string, fn: () => void, delay: number) {
  clearTimeout(delayTimeouts[id]);
  delayTimeouts[id] = setTimeout(fn, delay);
}

/* Escape HTML */
const entityMap: {[index: string]: string} = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': '&quot;',
  "'": '&#39;'
};

export function escapeHtml(s: string) {
  return String(s).replace(/[&<>"']/g, function (s) {
    return entityMap[s];
  });
}

export function escapeBrackets(s: string) {
  return String(s).replace(/[<>]/g, function (s) {
    return entityMap[s];
  });
}

// Removes undefined values from plain object
export function compactObject<T extends Object>(o: T): T {
  var clone: any = _.clone(o);
  _.each(clone, function(v, k) {
    if(_.isUndefined(v) && _.isString(k)) {
      delete clone[k];
    }
  });
  return clone;
}

// Makes a boolean record out of a string list
export function makeRecord(keys: string[]): Record<string, true> {
  let r: Record<string, true> = {};
  _.each(keys, (k) => {
    r[k] = true;
  });
  return r;
}

// Inverse of make record -- returns string list of records
export function recordToList(r: Record<string, boolean>): string[] {
  let ret: string[] = [];
  _.each(r, (v, k) => {
    if (k && v) {
      ret.push(k);
    }
  });
  return ret;
}


// Make a deferred object compatible with ES6 promises -- almost a drop-in
// replacement for JQueryDeferred
export class Deferred<T> {
  _promise: Promise<T>;
  _resolve: (value?: T | PromiseLike<T> | undefined) => void;
  _reject: (error?: Error) => void;
  state: "pending"|"resolved"|"rejected";

  constructor() {
    this._promise = new Promise((resolve, reject) => {
      this._resolve = resolve;
      this._reject = reject;
    });
    this.state = "pending";
  }

  promise(): Promise<T> {
    return this._promise;
  }

  resolve(value?: T | PromiseLike<T> | undefined): void {
    if (this.state === "pending") {
      this._resolve(value);
      this.state = "resolved";
    } else {
      throw new Error("Already " + this.state);
    }
  }

  reject(error?: Error): void {
    if (this.state === "pending") {
      this._reject(error);
      this.state = "rejected";
    } else {
      throw new Error("Already " + this.state);
    }
  }
}

/*
  Returns an object with a callback and a promise. If callback is not called
  by time t, promise will reject.
*/
export function timeoutP(t: number) {
  let dfd = new Deferred();
  setTimeout(function() { dfd.reject(); }, t);

  return {
    promise: dfd.promise(),
    cb: function() { dfd.resolve(); }
  };
}


/*
  Wrapper around a string list that adds hash for faster lookup for items.
  Assumes items are unique.
*/
export class OrderedSet<T> {
  // Map from value to index
  hash: Record<string, number>;

  // Ordered values -- may be sparse (i.e. no guarantee value exists for any
  // n such that n < list.length)
  list: T[]

  _keyFn: (t: T) => string;

  constructor(lst: T[], keyFn: (t: T) => string = stringify) {
    this.hash = {};
    this.list = [];
    this._keyFn = keyFn;
    _.each(lst, (l) => this.push(l));
  }

  // Returns a normal list (no sparse values)
  toList(): T[] {
    return _.filter(this.list, (l) => !_.isUndefined(l));
  }

  // Returns sparse list with possible undefined values
  toSparseList(): (T|undefined)[] {
    return this.list;
  }

  has(item: T): boolean {
    let key = this._keyFn(item);
    return this.hasKey(key);
  }

  hasKey(key: string): boolean {
    return typeof this.hash[key] === "number"
  }

  // Returns item as it appears in list (may differ from original depending
  // keyFn)
  get(item: T): T {
    let key = this._keyFn(item);
    return this.getByKey(key);
  }

  getByKey(key: string): T {
    return this.list[this.hash[key]];
  }

  /*
    For each and map functions that skips undefined values in our
    sparsely populated list
  */
  forEach(cb: (t: T) => void): void {
    this.map(cb);
  }

  filter(predicate: (t: T) => boolean): T[] {
    let ret: T[] = [];
    for (let i in this.list) {
      if (predicate(this.list[i])) {
        ret.push(this.list[i]);
      }
    }
    return ret;
  }

  map<U>(cb: (t: T) => U): U[] {
    let ret: U[] = [];
    for (let i in this.list) {
      ret.push(cb(this.list[i]));
    }
    return ret;
  }

  // Add item to end of list (if new) -- or replace existing one if key
  push(...items: T[]): void {
    _.each(items, (item) => {
      let key = this._keyFn(item);
      let index = this.hash[key];
      if (typeof index !== "number") {
        index = this.list.length;
        this.hash[key] = index;
      }
      this.list[index] = item;
    });
  }

  // Removes item (if any)
  pull(...items: T[]): void {
    _.each(items, (item) => {
      if (this.has(item)) {
        let key = this._keyFn(item);
        let index = this.hash[key];
        delete this.list[index];
        delete this.hash[key];
      }
    });
  }

  // Like push, but returns new set
  with(...items: T[]): this {
    let ret = this.clone();
    ret.push(...items);
    return ret;
  }

  // Like pull, but returns new set
  without(...items: T[]): this {
    let ret = this.clone();
    ret.pull(...items);
    return ret;
  }

  // Creates a copy of this OrderedSet
  clone(): this {
    let ret = _.clone(this);
    ret.hash = _.clone(this.hash);
    ret.list = _.clone(this.list);
    return ret;
  }
}

/*
  Subclass of OrderedSet for things with a normalized field
*/
interface Choice {
  normalized: string;
}

export class ChoiceSet<T extends Choice> extends OrderedSet<T> {
  constructor(lst: T[]) {
    super(lst, (l) => l.normalized);
  }
}