import * as _ from "lodash";
import { expect } from "chai";
import * as Groups from "./groups";
import * as ApiT from "../lib/apiT";
import makeGroup from "../fakes/groups-fake";

// Some group data for testing
const groupSummary1 = {
  group_name: "Group 1",
  group_timezone: "America/Los_Angeles"
};
const groupLabels1 = {
  group_labels: [{
    original: "Label",
    normalized: "label",
    color: "#CCEEFF"
  }]
};
const groupMembers1 = {
  group_individuals: [{
    uid: "uid",
    role: "Owner" as ApiT.GroupRole,
    email: "email@example.com"
  }],
  group_member_role: "Owner" as ApiT.GroupRole,
  group_teams: []
};

describe("groupDataReducer", function() {
  describe("when handling FETCH_START", function() {
    it("sets group_summaries", function() {
      let s1 = Groups.initState();
      let s2 = Groups.groupDataReducer(s1, {
        type: "GROUP_DATA",
        dataType: "FETCH_START",
        groupIds: ["id-1", "id-2"]
      });
      expect(s2).to.deep.equal({
        groupSummaries: {
          "id-1": "FETCHING",
          "id-2": "FETCHING"
        },
        groupLabels: {},
        groupMembers: {}
      });
    });

    it("does not replace existing data with FETCHING but does replace " +
       "FETCH_ERROR", function() {
      let s1: Groups.GroupState = {
        groupSummaries: {
          "id-1": groupSummary1,
        },
        groupLabels: {
          "id-1": groupLabels1,
        },
        groupMembers: {
          "id-1": "FETCH_ERROR"
        }
      };
      let s2 = Groups.groupDataReducer(s1, {
        type: "GROUP_DATA",
        dataType: "FETCH_START",
        groupIds: ["id-1", "id-2"],
        withMembers: true,
        withLabels: true
      });
      expect(s2).to.deep.equal({
        groupSummaries: {
          "id-1": groupSummary1,
          "id-2": "FETCHING"
        },
        groupLabels: {
          "id-1": groupLabels1,
          "id-2": "FETCHING"
        },
        groupMembers: {
          "id-1": "FETCHING",
          "id-2": "FETCHING"
        }
      });
    });

    it("marks label data as FETCHING when specified", function() {
      let s1 = Groups.initState();
      let s2 = Groups.groupDataReducer(s1, {
        type: "GROUP_DATA",
        dataType: "FETCH_START",
        groupIds: ["id-1"],
        withLabels: true
      });
      expect(s2).to.deep.equal({
        groupSummaries: {
          "id-1": "FETCHING"
        },
        groupLabels: {
          "id-1": "FETCHING"
        },
        groupMembers: {}
      });
    });

    it("marks member data as FETCHING when specified", function() {
      let s1 = Groups.initState();
      let s2 = Groups.groupDataReducer(s1, {
        type: "GROUP_DATA",
        dataType: "FETCH_START",
        groupIds: ["id-1"],
        withMembers: true
      });
      expect(s2).to.deep.equal({
        groupSummaries: {
          "id-1": "FETCHING"
        },
        groupLabels: {},
        groupMembers: {
          "id-1": "FETCHING"
        }
      });
    });
  });

  describe("when handling FETCH_END", function() {
    it("populates store with group data", function() {
      let s1 = Groups.initState();
      let g1 = makeGroup(_.extend({
        groupid: "id-1"
      }, groupMembers1, groupSummary1, groupLabels1));
      let s2 = Groups.groupDataReducer(s1, {
        type: "GROUP_DATA",
        dataType: "FETCH_END",
        groupIds: [g1.groupid],
        groups: [g1]
      });
      expect(s2).to.deep.equal({
        groupSummaries: {
          "id-1": groupSummary1
        },
        groupLabels: {
          "id-1": groupLabels1
        },
        groupMembers: {
          "id-1": groupMembers1
        }
      });
    });

    it("marks group labels data as FETCH_ERROR if id provided but data missing",
    function() {
      let s1 = Groups.initState();
      let g1 = makeGroup(_.extend({ groupid: "id-1" },
        groupMembers1, groupSummary1, groupLabels1));
      let s2 = Groups.groupDataReducer(s1, {
        type: "GROUP_DATA",
        dataType: "FETCH_END",
        groupIds: [g1.groupid],
        groups: [],
        withLabels: true
      });
      expect(s2).to.deep.equal({
        groupSummaries: {
          "id-1": "FETCH_ERROR"
        },
        groupLabels: {
          "id-1": "FETCH_ERROR"
        },
        groupMembers: {}
      });
    });

    it("marks group members data as FETCH_ERROR if id provided " +
       "but data missing",
    function() {
      let s1 = Groups.initState();
      let g1 = makeGroup(_.extend({ groupid: "id-1" },
        groupMembers1, groupSummary1, groupLabels1));
      let s2 = Groups.groupDataReducer(s1, {
        type: "GROUP_DATA",
        dataType: "FETCH_END",
        groupIds: [g1.groupid],
        groups: [],
        withMembers: true
      });
      expect(s2).to.deep.equal({
        groupSummaries: {
          "id-1": "FETCH_ERROR"
        },
        groupLabels: {},
        groupMembers: {
          "id-1": "FETCH_ERROR"
        }
      });
    });
  });
});

describe("groupUpdateReducer", () => {
  it("updates summary data in store", function() {
    let s1 = {
      ...Groups.initState(),
      groupSummaries: {
        "id-1": groupSummary1
      }
    };
    let s2 = Groups.groupUpdateReducer(s1, {
      type: "GROUP_UPDATE",
      groupId: "id-1",
      summary: {
        group_name: "New Group Name"
      }
    });

    expect(s2).to.deep.equal({
      groupSummaries: {
        "id-1": {
          ...groupSummary1,
          group_name: "New Group Name"
        }
      },
      groupLabels: {},
      groupMembers: {}
    });
  });

  it("does nothing if data is not ready when updating", function() {
    let s1 = {
      ...Groups.initState(),
      groupSummaries: {
        "id-1": "FETCHING" as "FETCHING"
      }
    };
    let s2 = Groups.groupUpdateReducer(s1, {
      type: "GROUP_UPDATE",
      groupId: "id-1",
      summary: {
        group_name: "New Group Name"
      }
    });

    expect(s2).to.deep.equal({
      groupSummaries: {
        "id-1": "FETCHING"
      },
      groupLabels: {},
      groupMembers: {}
    });
  });

  it("updates label data in store", function() {
    let s1 = {
      ...Groups.initState(),
      groupLabels: {
        "id-1": groupLabels1
      }
    };

    let newLabels = {
      group_labels: [{
        original: "New Label",
        normalized: "new label",
        color: "#CCEEFF"
      }]
    };
    let s2 = Groups.groupUpdateReducer(s1, {
      type: "GROUP_UPDATE",
      groupId: "id-1",
      labels: newLabels
    });

    expect(s2).to.deep.equal({
      groupSummaries: {},
      groupLabels: {
        "id-1": newLabels
      },
      groupMembers: {}
    });
  });

  it("updates member data in store", function() {
    let s1 = {
      ...Groups.initState(),
      groupMembers: {
        "id-1": groupMembers1
      }
    };

    let newMembers = {
      ...groupMembers1,
      group_teams: [{
        teamid: "team1"
      }]
    };
    let s2 = Groups.groupUpdateReducer(s1, {
      type: "GROUP_UPDATE",
      groupId: "id-1",
      members: newMembers
    });

    expect(s2).to.deep.equal({
      groupSummaries: {},
      groupLabels: {},
      groupMembers: {
        "id-1": newMembers
      }
    });
  });
})