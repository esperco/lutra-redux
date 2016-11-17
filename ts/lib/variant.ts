import * as _ from "lodash";

/*
  Type of variants (tagged unions) using atdgen's convention.

  If no value is associated with the tag, the JSON representation is just
  a string.
  If a value is associated with the tag, the representation is
  [tag,value] where value has its own type specific to the tag.
*/
export type Variant = string | [string, any];

export function tag(x: Variant): string {
  return _.isString(x) ? x : x[0];
}

export function value(x: Variant): any {
  return _.isString(x) ? null : x[1];
}

/* Sample usage:

  switch (Variant.tag(x)) {
    case "apples":
      doSomethingWithApples(Variant.value(x));
      break;
    case "oranges":
      doSomethingWithOranges(Variant.value(x));
      break;
  }
*/
