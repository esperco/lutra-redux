var exec = require('sync-exec');

/*
  Returns git hash as version
*/
module.exports = function() {
  var ret = exec("git log --pretty=format:'%H' -n 1");
  return ret && ret.stdout && ret.stdout.slice(0,12);
}
