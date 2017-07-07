import { Group } from "../lib/apiT";

export function makeGroup(params: Partial<Group> = {}): Group {
  let def = {
    groupid: "group-id",
    group_name: "My Group",
    group_timezone: "America/Los_Angeles",
    group_tb: true,
    group_tb_guests_min: 2,
    group_tb_guests_max: 18,
    group_tb_recurring: false,
    group_tb_same_domain: false
  };
  return { ...def, ...params };
}

export default makeGroup;