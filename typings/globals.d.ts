/* Global types we're having trouble picking up elsewhere */

/// <reference path="../node_modules/@types/es6-promise/index.d.ts" />
/// <reference path="../node_modules/@types/whatwg-fetch/index.d.ts" />
/// <reference path="../node_modules/@types/segment-analytics/index.d.ts" />

// Shim types for ES6
type IterableIterator<T> = any;
type IteratorResult<T> = any;
declare const Symbol: {
  iterator: symbol;
};

// Set by Webpack
declare var ESPER_VERSION: string;