/*
  For testing, types the "util-inspect module"
*/

declare module "util-inspect" {
  var inspect: (x: any, opts?: {
    showHidden?: boolean;
    depth?: number|null;
    colors?: boolean;
    maxArrayLength?: number;
    breakLength?: number;
    showProxy?: boolean;
    customInspect?: boolean;
  }) => string;
  export = inspect;
}
