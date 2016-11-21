/*
  Custom type def for config options
*/
declare module "config" {
  var config: {
    production: boolean;
    apiPrefix: string;
    loginRedirect: string;
    esperVersion?: string;
    logLevel: number; // => minmum level to log
    logTag?: string;
  };
  export = config;
}
