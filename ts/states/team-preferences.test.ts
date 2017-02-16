import { expect } from "chai";
import makePrefs from "../fakes/team-preferences-fake";
import * as ApiT from "../lib/apiT";
import { deepFreeze } from "../lib/util";
import { StoreData } from "./data-status";
import * as Prefs from "./team-preferences";

describe("Team preferences state", () => {
  const teamId = "team-id";
  function makeState(prefs?: StoreData<ApiT.Preferences>) {
    if (prefs) {
      return deepFreeze({
        ...Prefs.initState(),
        teamPreferences: { [teamId]: prefs }
      });
    }
    return deepFreeze(Prefs.initState());
  }

  describe("dataReducer", () => {
    it("sets status to FETCHING on FETCH_START", () => {
      let s1 = makeState();
      let s2 = Prefs.dataReducer(s1, {
        type: "TEAM_PREFERENCES_DATA",
        dataType: "FETCH_START",
        teamId
      });
      expect(s2.teamPreferences).to.deep.equal({
        [teamId]: "FETCHING"
      });
    });

    it("does not replace existing data with FETCHING on FETCH_START", () => {
      let s1 = makeState(makePrefs({}));
      let s2 = Prefs.dataReducer(s1, {
        type: "TEAM_PREFERENCES_DATA",
        dataType: "FETCH_START",
        teamId
      });
      expect(s2.teamPreferences).to.deep.equal(s1.teamPreferences);
    });

    it("updates state with data on FETCH_END", () => {
      let s1 = makeState("FETCHING");
      let preferences = makePrefs({});
      let s2 = Prefs.dataReducer(s1, {
        type: "TEAM_PREFERENCES_DATA",
        dataType: "FETCH_END",
        teamId, preferences
      });
      expect(s2.teamPreferences[teamId]).to.deep.equal(preferences);
    });

    it("specifies error on FETCH_END if no data", () => {
      let s1 = makeState("FETCHING");
      let s2 = Prefs.dataReducer(s1, {
        type: "TEAM_PREFERENCES_DATA",
        dataType: "FETCH_END",
        teamId
      });
      expect(s2.teamPreferences[teamId]).to.equal("FETCH_ERROR");
    });

    it("does not replace existing data with error on FETCH_END", () => {
      let s1 = makeState(makePrefs({}));
      let s2 = Prefs.dataReducer(s1, {
        type: "TEAM_PREFERENCES_DATA",
        dataType: "FETCH_END",
        teamId
      });
      expect(s2.teamPreferences).to.deep.equal(s1.teamPreferences);
    });
  });

  describe("updateReducer", () => {
    it("replaces a value in prefs with new one", () => {
      let slack_address = {
        slack_teamid: "teamid",
        slack_username: "username"
      };
      let s1 = makeState(makePrefs({ slack_address, event_link: false }));
      let s2 = Prefs.updateReducer(s1, {
        type: "TEAM_PREFERENCES_UPDATE",
        teamId, preferences: { event_link: true }
      });
      expect(s2.teamPreferences[teamId]).to.deep.equal(makePrefs({
        slack_address,
        event_link: true
      }));
    });
    Prefs.updateReducer
  });
});