import {
  Path, StringParam, NumberParam, StringArrayParam, BooleanParam
} from "../lib/routing";
import { AllSomeNoneParam } from "../lib/asn";
import { PeriodParam } from "../lib/period";

export const base = "/groups";

export const eventList = new Path({
  base,
  params: {
    groupId: StringParam,
  },
  optParams: {
    showFilters: BooleanParam,

    // Select single event
    eventId: StringParam,

    // Selection mode -- add or remove? Null implies replace
    selectMode: BooleanParam,

    // Query params
    labels: AllSomeNoneParam,
    contains: StringParam,
    participant: StringArrayParam,
    minCost: NumberParam,
    period: PeriodParam
  },
  hash: ["event-list", ":groupId"]
});

export const setup = new Path({
  base,
  params: {},
  hash: ["setup"]
});

export const settings = new Path({
  base,
  params: {
    groupId: StringParam
  },
  hash: ["settings", ":groupId"]
})

export const generalSettings = new Path({
  base,
  params: {
    groupId: StringParam
  },
  optParams: {
    editTeamId: StringParam,  // ID for team calendar modal
    onboarding: BooleanParam  // Onboarding mode
  },
  hash: ["settings", ":groupId", "general"]
});

export const labelSettings = new Path({
  base,
  params: {
    groupId: StringParam
  },
  hash: ["settings", ":groupId", "labels"]
});

export const notificationSettings = new Path({
  base,
  params: {
    groupId: StringParam
  },
  hash: ["settings", ":groupId", "notifications"]
});

export const miscSettings = new Path({
  base,
  params: {
    groupId: StringParam
  },
  hash: ["settings", ":groupId", "misc"]
})
