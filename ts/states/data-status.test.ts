import { expect } from "chai";
import * as DataStatus from "./data-status";

describe("dataReducer", function() {
  describe("whening processing DATA_START", function() {
    it("adds API calls by id to a map without mutating state", function() {
      let s1 = DataStatus.initState();
      let s2 = DataStatus.dataReducer(s1, {
        type: "DATA_START",
        id: "abc"
      });
      expect(s1.apiCalls).to.deep.equal({});
      expect(s2.apiCalls).to.deep.equal({ abc: false });
    });

    it("adds API calls by id to a map with a boolean value", function() {
      let s1 = DataStatus.initState();
      let s2 = DataStatus.dataReducer(s1, {
        type: "DATA_START",
        id: "abc",
        modData: true
      });
      expect(s1.apiCalls).to.deep.equal({});
      expect(s2.apiCalls).to.deep.equal({ abc: true });
    });
  });

  describe("when processing DATA_END", function() {
    it("removes API calls by id without mutating state", function() {
      let s1: DataStatus.DataState = {
        apiCalls: { abc: true, def: false }
      };
      let s2 = DataStatus.dataReducer(s1, {
        type: "DATA_END",
        id: "abc"
      });
      expect(s2.apiCalls).to.deep.equal({ def: false });
    });
  });
});
