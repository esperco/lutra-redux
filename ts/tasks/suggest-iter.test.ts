import { expect } from "chai";
import makeEvent from "../fakes/events-fake";
import { testLabel } from "../fakes/labels-fake";
import { fromDates } from "../lib/period";
import { makeQueryState, EventsState } from "../states/events";
import { handleQuerySuggest } from "./suggest-iter";

describe("handleQuerySuggest", () => {
  const calgroupId = "my-group-id";
  const query = { contains: "Test" };
  const notQuery = { contains: "Test 2" };
  const period = fromDates(
    new Date("2016-10-01"),
    new Date("2016-10-04"));

  const label1 = testLabel("Label 1");
  const label2 = testLabel("Label 2");
  const label3 = testLabel("Label 3");

  var state: EventsState;
  beforeEach(() => {
    state = {
      events: {
        [calgroupId]: {
          e1: makeEvent({ // In Query
            id: "e1",
            start: "2016-10-01T08:00:00.000",
            end:   "2016-10-01T09:00:00.000",
            labels: [label1],
            guests: [{
              email: "email1@example.com",
              display_name: "Person 1",
              response: "Needs_action"
            }, {
              email: "email2@example.com",
              response: "Accepted"
            }, {
              email: "email3@example.com",
              response: "Declined"
            }]
          }),

          e2: makeEvent({ // In Query
            id: "e2",
            start: "2016-10-02T10:00:00.000",
            end:   "2016-10-02T12:00:00.000",
            labels: [label1, label2],
            guests: [{
              email: "email1@example.com",
              response: "Tentative"
            }]
          }),

          e3: makeEvent({ // Not in query
            id: "e3",
            start: "2016-10-03T10:00:00.000",
            end:   "2016-10-03T12:00:00.000",
            labels: [label3],
            guests: [{
              email: "email4@example.com",
              response: "Tentative"
            }]
          })
        }
      },
      recurringEvents: {},
      eventQueries: {
        [calgroupId]: makeQueryState(
          period, query, ["e1", "e2"],
          makeQueryState(period, notQuery, ["e3"])
        )
      }
    };
  });

  it("returns an action with normalized labels and guests for all events",
  () => {
    expect(handleQuerySuggest({
      type: "QUERY_SUGGESTIONS",
      calgroupId, query, period
    }, state)).to.deep.equal({
      type: "SUGGESTIONS",
      calgroupId,
      labels: {
        [label1.normalized]: label1,
        [label2.normalized]: label2
      },
      guests: {
        "email1@example.com": {
          email: "email1@example.com",
          displayName: "Person 1"
        },
        "email2@example.com": {
          email: "email2@example.com"
        },
        "email3@example.com": {
          email: "email3@example.com"
        }
      }
    });
  });

  it("will still return data if some events are still FETCHING",
  () => {
    state.events[calgroupId]["e2"] = "FETCHING";
    expect(handleQuerySuggest({
      type: "QUERY_SUGGESTIONS",
      calgroupId, query, period
    }, state)).to.deep.equal({
      type: "SUGGESTIONS",
      calgroupId,
      labels: {
        [label1.normalized]: label1
      },
      guests: {
        "email1@example.com": {
          email: "email1@example.com",
          displayName: "Person 1"
        },
        "email2@example.com": {
          email: "email2@example.com"
        },
        "email3@example.com": {
          email: "email3@example.com"
        }
      }
    });
  });
});
