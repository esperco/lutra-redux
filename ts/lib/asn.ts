/*
  Helpers related to the all-some-none convention we use for selecting
  a subset of a given set of text labels.

    * all -> select items where there is any label
    * some -> select items where any label matches a label is this set
    * none -> select items where there is no label
*/
import * as _ from "lodash";
import { compactObject, makeRecord, recordToList } from "./util";
import { ParamType, BooleanParam, StringArrayParam } from "./routing";

export interface AllSomeNone {
  all?: boolean;
  some?: Record<string, boolean>;
  none?: boolean;
}

/*
  Takes a list of labels and returns the subset of matching labels
  given an AllSomeNone selection.

  Empty set means match on none. Returns null if no match.
*/
export function apply(labels: string[], q: AllSomeNone): string[]|null {
  if (q.all && labels.length) {
    return labels;
  }
  if (q.none && _.isEmpty(labels)) {
    return [];
  }
  if (q.some) {
    let ret: Record<string, boolean> = {};
    for (let i in labels) {
      let label = labels[i];
      if (q.some[label]) {
        ret[label] =true;
      }
    }
    return _.isEmpty(ret) ? null : _.keys(ret);
  }
  return null;
}

// Given a selection, is a given value "on"?
export function isSelected(asn: Readonly<AllSomeNone>, key: string): boolean {
  return !!(asn.all || (asn.some && asn.some[key]));
}

/*
  Update an existing AllSomeNone with new values. Automatically selects
  "all" if all choices are selected
*/
export function update(
  existing: Readonly<AllSomeNone>,
  update: Readonly<AllSomeNone>,
  choices: string[]
): AllSomeNone {
  let all = _.isBoolean(update.all) ? update.all : existing.all;
  let none = _.isBoolean(update.none) ? update.none : existing.none;

  let some =
    // If all is being set to false, clear some
    update.all === false ? {} : (

    // Else, use existing some as a starting point before we update it below
    (existing.all && !existing.some) ?
      makeRecord(choices) :
      _.clone(existing.some || {})
    );

  // Merge existing.some with update.some
  if (update.some && !update.all) {
    _.each(update.some, (v, k) => {
      if (k) {
        if (v) {
          some[k] = true;
        } else {
          delete some[k];
        }
      }
    });

    // If every choice is in some, then set all to true
    all = (!!choices.length && _.every(choices, (c) => some[c]));
  }

  return compactObject({
    all: all || undefined,
    some: (all || _.isEmpty(some)) ? undefined : some,
    none: none || undefined
  });
}

// Standard format for passing all-some-none values in URL
const ASNSeparator = ",";
export var AllSomeNoneParam: ParamType<AllSomeNone> = {
  clean(text: string) {
    let parts = text.split(ASNSeparator);
    let some = StringArrayParam.clean(parts.slice(2).join(ASNSeparator));
    return compactObject({
      all: BooleanParam.clean(parts[0]) || undefined,
      none: BooleanParam.clean(parts[1]) || undefined,
      some: _.isEmpty(some) ? undefined : makeRecord(some)
    });
  },

  toStr(asn: AllSomeNone) {
    return [
      BooleanParam.toStr(asn.all || false),
      BooleanParam.toStr(asn.none || false),
      StringArrayParam.toStr(recordToList(asn.some || {}))
    ].join(ASNSeparator);
  }
}
