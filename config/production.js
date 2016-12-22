module.exports = {
  production: true,
  apiPrefix: "https://app.esper.com",
  loginRedirect: location.protocol + "//" +
    location.hostname + "/login",
  logoutRedirect: location.protocol + "//" +
    location.hostname + "/login?logout=1",
  cacheDuration: 10 * 60 * 1000, // 10 min
  esperVersion: "lutra-redux",
  logLevel: 3, // Warn and above,
  logTag: "Esper",
  ravenUrl: "https://bbe6d54536694df0a01801dce5a012c1@sentry.io/115523"
};
