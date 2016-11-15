/*
  Custom type def for config options
*/
declare module "config" {
  var config: {
    production: boolean;
    logLevel: number; // => minmum level to log
    logTag?: string;
  };
  export = config;
}
