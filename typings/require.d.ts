/*
  Use require to bring in Webpack assets like CSS. Use ES6 import for actual
  compiles-to-Javascript code (TypeScript).
*/
interface Require {
  (module: string): any;

  /*
    https://webpack.js.org/guides/dependency-management/#require-context
  */
  context: (
    directory: string,
    useSubdirectories?: boolean,
    regExp?: RegExp
  ) => any;
}

declare const require: Require;