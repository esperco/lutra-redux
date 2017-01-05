import * as _ from "lodash";
import * as ApiT from "../lib/apiT";

export function makeGenericCalendarEvent(
    props: Partial<ApiT.GenericCalendarEvent> = {}
  ): ApiT.GenericCalendarEvent {
  var defaultEvent: ApiT.GenericCalendarEvent = {
    id: "id1",
    calendar_id: "calId",
    start: "2016-03-02T12:14:17.000-08:00",
    end: "2016-03-02T13:14:17.000-08:00",
    title: "Event",
    all_day: false,
    guests: [],
    comments: [],
    has_recurring_labels: false,
    labels_confirmed: true,
    labels_predicted: false,
    transparent: false,
    description_messageids: []
  };
  return _.extend(defaultEvent, props) as ApiT.GenericCalendarEvent;
}

export default makeGenericCalendarEvent;