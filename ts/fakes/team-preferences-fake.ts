import * as ApiT from "../lib/apiT";

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
    tb_allow_email_notif: true,
    tb_allow_slack_notif: true,
    fb_guests_min: 2,
    fb_guests_max: 18,
    fb_recurring: false,
    fb_same_domain: false,
    fb_allow_email_notif: true,
    fb_allow_slack_notif: true,
    general: { current_timezone: "America/Los_Angeles" },
    notes: ""
  };
  return { ...def, ...prefs };
}

export default makePrefs;