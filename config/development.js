module.exports = {
  production: false,

  // No port (assume API server is on Port 80)
  apiPrefix: location.protocol + "//" + location.hostname,

  loginRedirect: location.origin + "/login",
  logoutRedirect: location.orgin + "/login?logout=1",

  cacheDuration: 30 * 1000, // 30 sec
  esperVersion: "lutra-redux",
  logLevel: 0,
  logTag: "Esper"

  // Uncomment to test Raven in dev
  // , ravenUrl: "https://bbe6d54536694df0a01801dce5a012c1@sentry.io/115523"
};
