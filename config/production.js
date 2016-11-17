module.exports = {
  production: true,
  apiPrefix: "https://app.esper.com",
  loginRedirect: window.location.protocol + "//" +
    window.location.hostname + "/login",
  esperVersion: "lutra-redux",
  logLevel: 3, // Warn and above,
  logTag: "Esper"
};
