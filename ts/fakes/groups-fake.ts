import {
  Group, LabelInfo, GroupRole, GroupMember, GroupIndividual
} from "../lib/apiT";
import * as _ from "lodash";

export function makeGroup(params: {
  groupid?: string;
  group_name?: string;
  group_timezone?: string;
  group_labels?: LabelInfo[];
  group_member_role?: GroupRole;
  group_teams?: GroupMember[];
  group_individuals?: GroupIndividual[];
} = {}): Group {
  let def = {
    groupid: "group-id",
    group_name: "My Group",
    group_timezone: "America/Los_Angeles"
  };
  return _.extend(def, params);
}

export default makeGroup;