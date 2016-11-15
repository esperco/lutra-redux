import * as _ from "lodash";
import { expect } from "chai";
import { sandbox, stub } from "./sandbox";
import LocalStore from "./local-store";

describe("LocalStore", function() {
  beforeEach(function() {
    // Stub cookies
    var values: {[index: string]: string} = {};
    stub('document', {
      get cookie() {
        return _(values)
          .map((v: string, k: string) => k + "=" + v)
          .join(";");
      },

      set cookie(value) {
        let parts = value.split(';');
        let [k,v] = parts[0].split('=');
        values[k] = v;
      }
    });

    // Stub location to be HTTPS     
    stub('location', { protocol: 'https:' });
  });

  describe('with localStorage enabled', function() {
    beforeEach(function() {
      // Stub localStorage with fake functions
      var storage: {[index: string]: string} = {};
      stub('localStorage', {
        setItem: (k: string, v: string) => storage[k] = v,
        getItem: (k: string) => storage[k],
        removeItem: (k: string) => delete storage[k],
        clear: () => { storage = {}; }
      });
    });

    it("get + set should retrieve set data based on key", function() {
      LocalStore.set("key1", {cat: 5});
      LocalStore.set("key2", {dog: 6});
      expect(LocalStore.get("key1")).to.deep.equal({cat: 5});
      expect(LocalStore.get("key2")).to.deep.equal({dog: 6});
    });

    it("remove should clear data", function() {
      LocalStore.set("key1", {cat: 5});
      LocalStore.remove("key1");
      expect(LocalStore.get("key1")).to.be.undefined;
    });
  });

  describe("with localStorage disabled", function() {
    beforeEach(function() {
      stub('localStorage', {});
    });

    it("should still allow get + set using cookies", function() {
      LocalStore.set("key1", {cat: 5});
      LocalStore.set("key2", {dog: 6});
      expect(LocalStore.get("key1")).to.deep.equal({cat: 5});
      expect(LocalStore.get("key2")).to.deep.equal({dog: 6});
    });

    it("should still clear data with remove", function() {
      LocalStore.set("key1", {cat: 5});
      LocalStore.remove("key1");
      expect(LocalStore.get("key1")).to.be.undefined;
    });
  });
});
