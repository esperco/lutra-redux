module.exports = {
  production: false,
  
  // No port (assume API server is on Port 80)
  apiPrefix: window.location.protocol + "//" + window.location.hostname,

  loginRedirect: window.location.protocol + "//" +
    window.location.hostname + "/login",

  esperVersion: "lutra-redux",
  logLevel: 0,
  logTag: "Esper"
};
