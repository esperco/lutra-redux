import {
  Path, StringParam, NumberParam,
  StringArrayParam, BooleanParam
} from "../lib/routing";
import { AllSomeNoneParam } from "../lib/asn";
import { PeriodParam } from "../lib/period";

const base = "/groups";

export const eventList = new Path({
  base,
  params: {
    groupId: StringParam,
  },
  optParams: {
    showFilters: BooleanParam,
    eventId: StringParam,
    selectAll: BooleanParam,
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
