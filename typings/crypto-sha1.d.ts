/*
  Wrap crypto-js/SHA1 module declaration. This lets us just import 
  in just the crypto-js/SHA1 module and not the entire crypto package
*/

/// <reference path="../node_modules/@types/crypto-js/index.d.ts" />

declare module "crypto-js/sha1" {
  var SHA1: typeof CryptoJS.SHA1;
  export = SHA1;
}
