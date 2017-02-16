import * as ApiT from "../lib/apiT";
import * as _ from "lodash";

export function makePrefs(prefs: Partial<ApiT.Preferences>): ApiT.Preferences {
  let def: ApiT.Preferences = {
    email_types: {
      daily_agenda: {
        recipients: [],
        send_time: { hour: 0, minute: 0 }
      },
      tasks_update: {
        recipients: [],
        send_time: { hour: 0, minute: 0 }
      },
    },
    general: { current_timezone: "America/Los_Angeles" },
    notes: ""
  };
  return _.extend(def, prefs);
}

export default makePrefs;