/*
  Unwraps a T or null function
*/
export function match<T, A>(opt: T|null, matcher: {
  none: () => A; some: (x: T) => A
}): A {
   if (isNone(opt)) {
    return matcher.none();
  } else {
    return matcher.some(opt);
  }
}

/*
  Returns true if opt is null or undefined
*/
export function isNone<T>(opt: T|null): opt is null {
  return typeof opt === "undefined" || opt === null;
}

/*
  Returns true if opt is some non-null value
*/
export function isSome<T>(opt: T|null): opt is T {
  return !isNone(opt);
}

/*
  Monadic bind for Option.Opt, but `bind' is already used in the
  JavaScript standard library for something else, so let's call
  this flatMap à la Scala to avoid confusion.
*/
export function flatMap<T>(opt: T|null, fn: (x: T) => T|null) : T|null {
  return match(opt, {
    some : function(x) {
      return fn(x);
    },
    none : function() {
      return null;
    }
  });
}

/*
  Given a list of options, unwrap them if some -- i.e. what flatMap
  in Scala does (which is would we'd call this function if it wasn't
  already taken above ...)
*/
export function flatten<T>(opts: Array<T|null>): T[] {
  return <T[]> opts.filter((x) => x !== null);
}

/*
  Helper to help Typescript infer types when matching against lists
  Otherwise, `none: () => []` will return any
*/
export function matchList<E>(opt: E[]|null): E[] {
  return match(opt, {
    none: (): E[] => [],
    some: (s) => s
  });
}

/*
  Shallow equality check for options -- treats none values like null and
  undefined as the same.
*/
export function eq<T>(a:T|null, b:T|null): boolean {
  return match(a, {
    none: () => isNone(b),
    some: (v) => v === b
  });
}
