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
    tb_guests_min: 2,
    tb_guests_max: 18,
    tb_recurring: false,
    tb_same_domain: false,
    general: { current_timezone: "America/Los_Angeles" },
    notes: ""
  };
  return _.extend(def, prefs);
}

export default makePrefs;