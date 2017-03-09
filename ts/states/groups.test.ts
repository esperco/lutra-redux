import * as _ from "lodash";
import { expect } from "chai";
import * as Groups from "./groups";
import * as ApiT from "../lib/apiT";
import { deepFreeze } from "../lib/util";
import makeEvent from "../fakes/events-fake";
import makeGroup from "../fakes/groups-fake";
import makeLogin from "../fakes/login-fake";

// Some group data for testing
const groupSummary1 = {
  group_name: "Group 1",
  group_timezone: "America/Los_Angeles",
  group_tb: true,
  group_tb_guests_min: 2,
  group_tb_guests_max: 18
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
  group_teams: [] as ApiT.GroupMember[]
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
        groupMembers: {},
        groupPreferences: {}
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
        },
        groupPreferences: {}
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
        },
        groupPreferences: {}
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
        groupMembers: {},
        groupPreferences: {}
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
        },
        groupPreferences: {}
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
        },
        groupPreferences: {}
      });
    });

    it("adds groupIds to login state if applicable", function() {
      let s1 = deepFreeze({
        ...Groups.initState(),
        login: makeLogin({
          groups: ["id-0"]
        })
      });
      let g1 = makeGroup(_.extend({
        groupid: "id-1"
      }, groupMembers1, groupSummary1, groupLabels1));
      let s2 = Groups.groupDataReducer(s1, {
        type: "GROUP_DATA",
        dataType: "FETCH_END",
        groupIds: [g1.groupid],
        groups: [g1]
      });
      expect(s2.login.groups).to.deep.equal(["id-0", "id-1"]);
    });

    it("does not duplicate groupIds in login state", function() {
      let s1 = deepFreeze({
        ...Groups.initState(),
        login: makeLogin({
          groups: ["id-1"]
        })
      });
      let g1 = makeGroup(_.extend({
        groupid: "id-1"
      }, groupMembers1, groupSummary1, groupLabels1));
      let s2 = Groups.groupDataReducer(s1, {
        type: "GROUP_DATA",
        dataType: "FETCH_END",
        groupIds: [g1.groupid],
        groups: [g1]
      });
      expect(s2.login.groups).to.deep.equal(["id-1"]);
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
        groupMembers: {},
        groupPreferences: {}
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
        },
        groupPreferences: {}
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
      groupMembers: {},
      groupPreferences: {}
    });
  });

  it("resets event state if timebomb changed", function() {
    let eventId = "event-id";
    let s1 = {
      ...Groups.initState(),
      groupSummaries: {
        "id-1": groupSummary1
      },
      events: {
        "id-1": {
          [eventId]: makeEvent({ id: eventId })
        }
      },
      eventQueries: {
        "id-1": [{
          "{}": {
            query: {},
            eventIds: [eventId],
            updatedOn: new Date()
          }
        }]
      }
    };
    let s2 = Groups.groupUpdateReducer(s1, {
      type: "GROUP_UPDATE",
      groupId: "id-1",
      summary: {
        group_tb: !groupSummary1.group_tb,
        group_tb_guests_max: groupSummary1.group_tb_guests_max + 1
      }
    });
    expect(s2).to.deep.equal({
      groupSummaries: {
        "id-1": {
          ...groupSummary1,
          group_tb: !groupSummary1.group_tb,
          group_tb_guests_max: groupSummary1.group_tb_guests_max + 1
        }
      },
      groupLabels: {},
      groupMembers: {},
      groupPreferences: {},
      events: { "id-1": {} },
      eventQueries: { "id-1": [] },
      recurringEvents: { "id-1": {} }
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
      groupMembers: {},
      groupPreferences: {}
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
      groupMembers: {},
      groupPreferences: {}
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
      },
      groupPreferences: {}
    });
  });
})


/* State for GIM testing */
const groupId = "group-id";
const s1 = deepFreeze({
  ...Groups.initState(),
  groupSummaries: { [groupId]: groupSummary1 },
  groupLabels: { [groupId]: groupLabels1 },
  groupMembers: { [groupId]: groupMembers1 }
});

describe("groupAddGIMReducer", () => {
  it("should add new GIM without UID", () => {
    let gim = {
      email: "email2@example.com",
      role: "Member" as "Member"
    };
    let s2 = Groups.groupAddGIMReducer(s1, {
      type: "GROUP_ADD_GIM", groupId, gim
    });

    expect(s2.groupMembers[groupId].group_individuals).to.deep.equal([
      s1.groupMembers[groupId].group_individuals[0],
      gim
    ]);
  });

  it("should de-duplicate GIMs by UID", () => {
    let gim = {
      uid: s1.groupMembers[groupId].group_individuals[0].uid,
      email: "email2@example.com",
      role: "Owner" as "Owner"
    };
    let s2 = Groups.groupAddGIMReducer(s1, {
      type: "GROUP_ADD_GIM", groupId, gim
    });

    expect(s2.groupMembers[groupId].group_individuals).to.deep.equal([gim]);
  });

  it("should de-dupicate GIMs by email", () => {
    let gim1 = {
      email: "email2@example.com",
      role: "Member" as "Member"
    };
    let s2 = Groups.groupAddGIMReducer(s1, {
      type: "GROUP_ADD_GIM", groupId, gim: gim1
    });

    let gim2 = {
      ...gim1,
      uid: "uid2"
    };
    let s3 = Groups.groupAddGIMReducer(deepFreeze(s2), {
      type: "GROUP_ADD_GIM", groupId, gim: gim2
    });

    expect(s3.groupMembers[groupId].group_individuals).to.deep.equal([
      s1.groupMembers[groupId].group_individuals[0],
      gim2
    ]);
  });

  it("should add an associated team", () => {
    let gim = s1.groupMembers[groupId].group_individuals[0];
    let member = {
      teamid: "teamid",
      email: "email@example.com",
      name: "John Snow"
    };
    let s2 = Groups.groupAddGIMReducer(s1, {
      type: "GROUP_ADD_GIM", groupId, gim, member
    });

    expect(s2.groupMembers[groupId].group_teams).to.deep.equal([member]);
  });

  it("should de-duplicate team by teamid", () => {
    let gim = s1.groupMembers[groupId].group_individuals[0];
    let member1 = {
      teamid: "teamid",
      name: "John Snow"
    };
    let s2 = Groups.groupAddGIMReducer(s1, {
      type: "GROUP_ADD_GIM", groupId, gim, member: member1
    });

    let member2 = {
      ...member1,
      name: "Bob Johnson"
    };
    let s3 = Groups.groupAddGIMReducer(deepFreeze(s2), {
      type: "GROUP_ADD_GIM", groupId, gim, member: member2
    });
    expect(s3.groupMembers[groupId].group_teams).to.deep.equal([member2]);
  });
});

describe("groupDeleteGIMReducer", () => {
  it("should remove an existing GIM", () => {
    let gim = s1.groupMembers[groupId].group_individuals[0];
    expect(Groups.groupDeleteGIMReducer(s1, {
      type: "GROUP_DELETE_GIM", groupId, gim
    }).groupMembers[groupId].group_individuals).to.deep.equal([]);
  });

  it("should remove an existing GIM by email", () => {
    let gim = s1.groupMembers[groupId].group_individuals[0];
    expect(Groups.groupDeleteGIMReducer(s1, {
      type: "GROUP_DELETE_GIM", groupId, gim: {
        email: gim.email,
        role: gim.role
      }
    }).groupMembers[groupId].group_individuals).to.deep.equal([]);
  });

  it("should remove an associated team by email", () => {
    let gim = s1.groupMembers[groupId].group_individuals[0];
    let s2 = {
      ...s1,
      groupMembers: {
        ...s1.groupMembers,
        [groupId]: {
          ...s1.groupMembers[groupId],
          group_teams: [{
            email: gim.email,
            teamid: "team-id"
          }]
        }
      }
    };

    expect(Groups.groupDeleteGIMReducer(deepFreeze(s2), {
      type: "GROUP_DELETE_GIM", groupId, gim: {
        email: gim.email,
        role: gim.role
      }
    }).groupMembers[groupId].group_teams).to.deep.equal([]);
  });

  it("should remove an existing GIM by UID", () => {
    let gim = s1.groupMembers[groupId].group_individuals[0];
    expect(Groups.groupDeleteGIMReducer(s1, {
      type: "GROUP_DELETE_GIM", groupId, gim: {
        uid: gim.uid,
        role: gim.role
      }
    }).groupMembers[groupId].group_individuals).to.deep.equal([]);
  });
});

describe("deleteGroupTeamReducer", () => {
  it("should remove an existing team by teamId", () => {
    let s2 = _.cloneDeep(s1);
    s2.groupMembers[groupId].group_teams = [{
      email: "email@example.com",
      teamid: "team-id"
    }];

    expect(Groups.groupDeleteTeamReducer(deepFreeze(s2), {
      type: "GROUP_DELETE_TEAM",
      groupId, teamId: "team-id"
    }).groupMembers[groupId].group_teams).to.deep.equal([]);
  });
});