module.exports = {
  production: true,
  apiPrefix: "https://app.esper.com",
  loginRedirect: window.location.protocol + "//" +
    window.location.hostname + "/login",
  logoutRedirect: window.location.protocol + "//" +
    window.location.hostname + "/login?logout=1",
  cacheDuration: 10 * 60 * 1000, // 10 min
  esperVersion: "lutra-redux",
  logLevel: 3, // Warn and above,
  logTag: "Esper"
};
