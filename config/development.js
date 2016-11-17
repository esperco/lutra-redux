module.exports = {
  production: false,
  
  // No port (assume API server is on Port 80)
  apiPrefix: window.location.protocol + "//" + window.location.hostname,

  esperVersion: "lutra-redux",
  logLevel: 0,
  logTag: "Esper"
};
