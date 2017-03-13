import { expect } from "chai";
import makeCal from "../fakes/cals-fake";
import makeEvent from "../fakes/events-fake";
import { deepFreeze } from "../lib/util";
import * as Events from "./events";
import * as Cals from "./team-cals";

const teamId = "teamId";
const cal1 = makeCal({ id: "id1" });
const cal2 = makeCal({ id: "id2" });
const makeState = () => deepFreeze({
  teamCalendars: {
    [teamId]: {
      available: [cal1, cal2],
      selected: [cal1]
    }
  }
});

describe("teamCalendarUpdateReducer", () => {
  it("resets event state", () => {
    let eventId = "event-id";
    let eventsState = Events.initState();
    eventsState.events = {
      [teamId]: {
        [eventId]: makeEvent({ id: eventId })
      }
    };
    eventsState.eventQueries = {
      [teamId]: [{
        "{}": {
          query: {},
          eventIds: [eventId],
          updatedOn: new Date()
        }
      }]
    };

    let s1 = deepFreeze({
      ...makeState(),
      ...Events.initState(),
    });
    let s2 = Cals.teamCalendarUpdateReducer(s1, {
      type: "TEAM_CALENDAR_UPDATE",
      teamId, selected: [cal2]
    });
    expect(s2.teamCalendars[teamId]).to.deep.equal({
      available: [cal1, cal2],
      selected: [cal2]
    });
    expect(s2.events[teamId]).to.deep.equal({});
    expect(s2.eventQueries[teamId]).to.deep.equal([]);
  });
});
