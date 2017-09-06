module.exports = {
  production: true,
  apiPrefix: "https://app.esper.com",
  loginRedirect: function(hex) {
    return location.protocol + "//" + location.hostname +
           "/login?redirect=" + hex;
  },
  logoutRedirect: location.protocol + "//" +
    location.hostname + "/login?logout=1",
  deactivateRedirect: location.protocol + "//" +
    location.hostname + "/login?logout=1&msg=deactivate",
  cacheDuration: 10 * 60 * 1000, // 10 min
  maxDaysFetch: 5,
  esperVersion: "lutra-redux",
  logLevel: 3, // Warn and above,
  logTag: "Esper",
  tbMinIncr: 1
  
  // Disable Raven (shutdown)
  // , ravenUrl: "https://bbe6d54536694df0a01801dce5a012c1@sentry.io/115523"
};
