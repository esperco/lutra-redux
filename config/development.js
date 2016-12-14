module.exports = {
  production: false,

  // No port (assume API server is on Port 80)
  apiPrefix: window.location.protocol + "//" + window.location.hostname,

  loginRedirect: window.location.origin + "/login",
  logoutRedirect: window.location.orgin + "/login?logout=1",

  cacheDuration: 30 * 1000, // 30 sec
  esperVersion: "lutra-redux",
  logLevel: 0,
  logTag: "Esper"
};
