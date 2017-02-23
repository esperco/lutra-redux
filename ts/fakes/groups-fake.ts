import {
  Group, LabelInfo, GroupRole, GroupMember, GroupIndividual
} from "../lib/apiT";
import * as _ from "lodash";

export function makeGroup(params: {
  groupid?: string;
  group_name?: string;
  group_timezone?: string;
  group_tb?: boolean;
  group_tb_guests_min?: number;
  group_tb_guests_max?: number;
  group_labels?: LabelInfo[];
  group_member_role?: GroupRole;
  group_teams?: GroupMember[];
  group_individuals?: GroupIndividual[];
} = {}): Group {
  let def = {
    groupid: "group-id",
    group_name: "My Group",
    group_timezone: "America/Los_Angeles",
    group_tb: true,
    group_tb_guests_min: 2,
    group_tb_guests_max: 18
  };
  return _.extend(def, params);
}

export default makeGroup;