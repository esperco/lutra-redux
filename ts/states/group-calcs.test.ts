import { expect } from "chai";
import { deepFreeze } from "../lib/util";
import { calcReducer, initState, calcKey } from "./group-calcs";

describe("calcReducer", () => {
  const groupId = "my-group-id";
  const query = { contains: "test" };
  const period = { interval: "week" as "week", start: 123, end: 124 };

  describe("with GROUP_CALC_START", () => {
    it("marks new entries as FETCHING", () => {
      let state = initState();
      let state2 = calcReducer(deepFreeze(state), {
        type: "GROUP_CALC_START",
        groupId, query, period
      });

      let key = calcKey(period, query);
      expect(key).to.be.a("string");
      expect(state2.groupCalcs[groupId][key]).to.equal("FETCHING");
    });

    it("doesn't replace existing data with FETCHING", () => {
      let key = calcKey(period, query);
      let results = { seconds: 123, eventCount: 1, peopleSeconds: 123 };
      let state = {
        groupCalcs: {
          [groupId]: {
            [key]: results
          }
        }
      };
      let state2 = calcReducer(deepFreeze(state), {
        type: "GROUP_CALC_START",
        groupId, query, period
      });
      expect(state2.groupCalcs[groupId][key]).to.deep.equal(results);
    });
  });

  describe("with GROUP_CALC_END", () => {
    it("adds results to store", () => {
      let results = { seconds: 123, eventCount: 1, peopleSeconds: 123 };
      let key = calcKey(period, query);
      let state = {
        groupCalcs: {
          [groupId]: {
            [key]: "FETCHING" as "FETCHING"
          }
        }
      };
      let state2 = calcReducer(deepFreeze(state), {
        type: "GROUP_CALC_END",
        groupId, query, period, results
      });
      expect(state2.groupCalcs[groupId][key]).to.deep.equal(results);
    });
  });
});