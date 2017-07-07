/* Global types we're having trouble picking up elsewhere */

/// <reference path="../node_modules/@types/segment-analytics/index.d.ts" />

// Set by Webpack
declare var ESPER_VERSION: string;

// Polyfills that TS doesn't have
interface Array<T> {
  includes: (target: T, fromIndex?: number) => boolean;
}

interface ObjectConstructor {
  values: <T>(obj: Record<string, T>) => T[];
}