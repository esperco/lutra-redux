/*
  Polyfill some ES6 native functions using lodash
*/

// Feature check to verify we're on IE11.
if (typeof window.crypto === "undefined" &&
    typeof window.msCrypto === "undefined") {
  let update = confirm(
    "Esper requires a modern browser to function properly. Please " +
    "update your browser before continuing."
  );
  if (update) location.href = "https://outdatedbrowser.com/";
}

function _shimPrototype(obj, name, shim) {
  if (! obj.prototype[name]) {
    Object.defineProperty(obj.prototype, name, {
      value: function() {
        var args = Array.prototype.slice.call(arguments);
        args.unshift(this);
        return shim(this, arguments) }
      }
    );
  }
}

import _assign from "lodash/assign";
import _endsWith from "lodash/endsWith";
import _find from "lodash/find";
import _findIndex from "lodash/findIndex";
import _includes from "lodash/includes";
import _repeat from "lodash/repeat";
import _startsWith from "lodash/startsWith";
import _values from "lodash/values";

if (typeof Object.assign !== 'function') {
  Object.assign = _assign;
}

_shimPrototype(String, "endsWith", _endsWith);
_shimPrototype(Array, "find", _find);
_shimPrototype(Array, "findIndex", _findIndex);
_shimPrototype(Array, "includes", _includes);
_shimPrototype(String, "includes", _includes);
_shimPrototype(String, "repeat", _repeat);
_shimPrototype(String, "startsWith", _startsWith);

if (typeof Object.values !== 'function') {
  Object.values = _values;
}