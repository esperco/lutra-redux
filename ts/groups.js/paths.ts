import { Path, StringParam, BooleanParam } from "../lib/routing";
import { AllSomeNoneParam } from "../lib/asn";

const base = "/groups";

export const eventList = new Path({
  base,
  params: {
    groupId: StringParam,
  },
  optParams: {
    showFilters: BooleanParam,
    eventId: StringParam,
    labels: AllSomeNoneParam
  },
  hash: ["event-list", ":groupId"]
});

export const setup = new Path({
  base,
  params: {},
  hash: ["setup"]
});
