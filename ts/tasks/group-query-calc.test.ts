import * as _ from "lodash";
import { expect } from "chai";
import makeEvent from "../fakes/events-fake";
import { testLabel } from "../fakes/labels-fake";
import * as ApiT from "../lib/apiT";
import { fromDates } from "../lib/period";
import { makeQueryState, EventsState } from "../states/events";
import { GroupState, initState } from "../states/groups";
import { handleGroupQueryCalc } from "./group-query-calc";

describe("handleGroupQueryCalc", () => {
  const groupId = "my-group-id";
  const query = { contains: "Test" };
  const notQuery = { contains: "Test 2" };
  const period = fromDates(
    new Date("2016-10-01"),
    new Date("2016-10-04"));

  const label1 = testLabel("Label 1");
  const label2 = testLabel("Label 2");

  const e1 = makeEvent({ // 1 hours * 2 (attending) guests
    id: "e1",
    start: "2016-10-01T08:00:00.000",
    end:   "2016-10-01T09:00:00.000",
    labels: [label1, label2],
    guests: [{
      email: "email1@example.com",  // Not in team
      response: "Needs_action"
    }, {
      email: "email2@example.com",  // In team
      response: "Accepted"
    }, {
      email: "email3@example.com",  // In team but declined
      response: "Declined"
    }]
  });
  const e1Duration = 60 * 60;
  const e1NumGuests = 2;
  const e1NumGroupGuests = 1;

  const e2 = makeEvent({ // 2 hours * 1 guest
    id: "e2",
    start: "2016-10-02T10:00:00.000",
    end:   "2016-10-02T12:00:00.000",
    labels: [label2],
    guests: [{
      email: "email1@example.com",  // Not in team
      response: "Tentative"
    }]
  });
  const e2Duration = 2 * 60 * 60;
  const e2NumGuests = 1;
  const e2NumGroupGuests = 0;

  const e3 = makeEvent({ // 1 hour * 1 guest -- unlabeled
    id: "e3",
    start: "2016-10-03T10:00:00.000",
    end:   "2016-10-03T11:00:00.000",
    guests: [{
      email: "email1@example.com", // Not in team
      response: "Tentative"
    }]
  });
  const e3Duration = 1 * 60 * 60;
  const e3NumGuests = 1;
  const e3NumGroupGuests = 0;

  const e4 = makeEvent({ // 1 hour * 1 guest, but not in query
    id: "e4",
    start: "2016-10-03T15:00:00.000",
    end:   "2016-10-03T16:00:00.000",
    guests: [{
      email: "email1@example.com",
      response: "Tentative"
    }]
  });

  var state: EventsState & GroupState;
  beforeEach(() => {
    state = {
      ...initState(),
      groupSummaries: {
        [groupId]: {
          group_name: "My Group",
          group_timezone: "America/Los_Angeles",
          group_tb: true,
          group_tb_guests_min: 2,
          group_tb_guests_max: 18
        }
      },
      groupMembers: {
        [groupId]: {
          group_member_role: "Manager",
          group_teams: [{
            teamid: "team2",
            email: "email2@example.com",
            name: "User 2"
          }, {
            teamid: "team3",
            email: "email3@example.com",
            name: "User 3"
          }],
          group_individuals: [{
            uid: "user1",
            email: "email1@example.com",
            role: "Manager"
          }]
        }
      },
      events: {
        [groupId]: {
          e1: _.cloneDeep(e1),
          e2: _.cloneDeep(e2),
          e3: _.cloneDeep(e3),
          e4: _.cloneDeep(e4)
        }
      },

      recurringEvents: {},

      eventQueries: {
        [groupId]: makeQueryState(
          period, query, ["e1", "e2", "e3"],
          makeQueryState(period, notQuery, ["e4"])
        )
      }
    };
  });

  it("handles missing group gracefully", () => {
    expect(handleGroupQueryCalc({
      type: "GROUP_QUERY_CALC",
      groupId: "wrong-group-id",
      query,
      period
    }, state)).to.not.be.ok;
  });

  it("returns falsy if missing event days", () => {
    expect(handleGroupQueryCalc({
      type: "GROUP_QUERY_CALC",
      groupId,
      query,
      period: { ...period, end: period.end + 1 }
    }, state)).to.not.be.ok;
  });

  it("returns falsy if query includes missing events", () => {
    state.events[groupId]["e2"] = "FETCHING";
    expect(handleGroupQueryCalc({
      type: "GROUP_QUERY_CALC",
      groupId,
      query,
      period
    }, state)).to.not.be.ok;
  });

  it("returns a GROUP_CALC_END action if all data available", () => {
    expect(handleGroupQueryCalc({
      type: "GROUP_QUERY_CALC",
      groupId,
      query: query,
      period
    }, state)).to.deep.equal({
      type: "GROUP_CALC_END",
      groupId,
      query: query,
      period,
      results: {
        seconds: e1Duration + e2Duration + e3Duration,
        eventCount: 3,
        peopleSeconds: e1NumGuests * e1Duration +
                       e2NumGuests * e2Duration +
                       e3NumGuests * e3Duration,
        groupPeopleSeconds: e1NumGroupGuests * e1Duration +
                            e2NumGroupGuests * e2Duration +
                            e3NumGroupGuests * e3Duration,
        labelResults: {
          [label1.normalized]: {
            seconds: e1Duration,
            eventCount: 1,
            peopleSeconds: e1NumGuests * e1Duration,
            groupPeopleSeconds: e1NumGroupGuests * e1Duration
          },
          [label2.normalized]: {
            seconds: e1Duration + e2Duration,
            eventCount: 2,
            peopleSeconds: e1NumGuests * e1Duration +
                           e2NumGuests * e2Duration,
            groupPeopleSeconds: e1NumGroupGuests * e1Duration +
                                e2NumGroupGuests * e2Duration
          }
        },
        unlabeledResult: {
          eventCount: 1,
          seconds: e3Duration,
          peopleSeconds: e3NumGuests * e3Duration,
          groupPeopleSeconds: e3NumGroupGuests * e3Duration
        }
      }
    });
  });

  it("truncates long events based on period", () => {
    let event = state.events[groupId]["e1"] as ApiT.GenericCalendarEvent;
    let e1Duration = 4 * 24 * 60 * 60;
    event.start = "2016-09-01";
    event.end   = "2016-11-01";
    expect(handleGroupQueryCalc({
      type: "GROUP_QUERY_CALC",
      groupId,
      query: query,
      period
    }, state)).to.deep.equal({
      type: "GROUP_CALC_END",
      groupId,
      query: query,
      period,
      results: {
        seconds: e1Duration + e2Duration + e3Duration,
        eventCount: 3,
        peopleSeconds: e1NumGuests * e1Duration +
                       e2NumGuests * e2Duration +
                       e3NumGuests * e3Duration,
        groupPeopleSeconds: e1NumGroupGuests * e1Duration +
                            e2NumGroupGuests * e2Duration +
                            e3NumGroupGuests * e3Duration,
        labelResults: {
          [label1.normalized]: {
            seconds: e1Duration,
            eventCount: 1,
            peopleSeconds: e1NumGuests * e1Duration,
            groupPeopleSeconds: e1NumGroupGuests * e1Duration
          },
          [label2.normalized]: {
            seconds: e1Duration + e2Duration,
            eventCount: 2,
            peopleSeconds: e1NumGuests * e1Duration +
                           e2NumGuests * e2Duration,
            groupPeopleSeconds: e1NumGroupGuests * e1Duration +
                                e2NumGroupGuests * e2Duration
          }
        },
        unlabeledResult: {
          eventCount: 1,
          seconds: e3Duration,
          peopleSeconds: e3NumGuests * e3Duration,
          groupPeopleSeconds: e3NumGroupGuests * e3Duration
        }
      }
    });
  });

  it("ignores hidden events", () => {
    let event1 = state.events[groupId]["e1"] as ApiT.GenericCalendarEvent;
    event1.hidden = true;
    let event3 = state.events[groupId]["e3"] as ApiT.GenericCalendarEvent;
    event3.hidden = true;
    expect(handleGroupQueryCalc({
      type: "GROUP_QUERY_CALC",
      groupId,
      query: query,
      period
    }, state)).to.deep.equal({
      type: "GROUP_CALC_END",
      groupId,
      query: query,
      period,
      results: {
        seconds: e2Duration,
        eventCount: 1,
        peopleSeconds: e2NumGuests * e2Duration,
        groupPeopleSeconds: e2NumGroupGuests * e2Duration,
        labelResults: {
          [label2.normalized]: {
            seconds: e2Duration,
            eventCount: 1,
            peopleSeconds: e2NumGuests * e2Duration,
            groupPeopleSeconds: e2NumGroupGuests * e2Duration
          }
        },
        unlabeledResult: {
          eventCount: 0,
          seconds: 0,
          peopleSeconds: 0,
          groupPeopleSeconds: 0
        }
      }
    });
  });
});
