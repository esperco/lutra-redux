/*
  Custom type def for config options
*/
declare module "config" {
  var config: {
    production: boolean;
    apiPrefix: string;
    loginRedirect: string;
    logoutRedirect: string;
    cacheDuration?: number; // Milliseconds before data is stale
    maxDaysFetch?: number;  // Max number of days in a query to fetch
                            // per API call
    esperVersion?: string;
    logLevel: number; // => minmum level to log
    logTag?: string;
    ravenUrl?: string;
  };
  export = config;
}
