import { expect } from "chai";
import makeEvent from "../fakes/events-fake";
import * as ApiT from "../lib/apiT";
import { fromDates } from "../lib/period";
import { makeQueryState, EventsState } from "../states/group-events";
import { handleGroupQueryCalc } from "./group-query-calc";

describe("handleGroupQueryCalc", () => {
  const groupId = "my-group-id";
  const query = { contains: "Test" };
  const notQuery = { contains: "Test 2" };
  const period = fromDates(
    new Date("2016-10-01"),
    new Date("2016-10-04"));

  var state: EventsState;
  beforeEach(() => {
    state = {
      groupEvents: {
        [groupId]: {
          e1: makeEvent({
            id: "e1",
            start: "2016-10-01T08:00:00.000",
            end:   "2016-10-01T09:00:00.000",
            guests: [{
              email: "email1@example.com",
              response: "Needs_action"
            }, {
              email: "email2@example.com",
              response: "Accepted"
            }, {
              email: "email3@example.com",
              response: "Declined"
            }]
          }),

          e2: makeEvent({
            id: "e2",
            start: "2016-10-02T10:00:00.000",
            end:   "2016-10-02T12:00:00.000",
            guests: [{
              email: "email1@example.com",
              response: "Tentative"
            }]
          }),

          e3: makeEvent({
            id: "e3",
            start: "2016-10-03T10:00:00.000",
            end:   "2016-10-03T12:00:00.000",
            guests: [{
              email: "email1@example.com",
              response: "Tentative"
            }]
          })
        }
      },

      groupRecurringEvents: {},

      groupEventQueries: {
        [groupId]: makeQueryState(
          period, query, ["e1", "e2"],
          makeQueryState(period, notQuery, ["e3"])
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
    state.groupEvents[groupId]["e2"] = "FETCHING";
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
        seconds: 3 * 60 * 60,
        eventCount: 2,
        peopleSeconds: (2 * 1 * 60 * 60) + (1 * 2 * 60 * 60)
      }
    });
  });

  it("truncates long events based on period", () => {
    let event = state.groupEvents[groupId]["e1"] as ApiT.GenericCalendarEvent;
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
        seconds: (4 * 24 * 60 * 60) +  (2 * 60 * 60),
        eventCount: 2,
        peopleSeconds: (2 * 4 * 24 * 60 * 60) + (1 * 2 * 60 * 60)
      }
    });
  });
});
