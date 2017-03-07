import { Path } from "../lib/routing";
import { PeriodParam } from "../lib/period";

const base = "/tb";

export const eventList = new Path({
  base,
  params: {},
  optParams: {
    period: PeriodParam
  },
  hash: ["event-list"]
});
