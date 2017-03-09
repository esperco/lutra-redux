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

export const settings = new Path({
  base,
  params: {},
  hash: ["settings"]
});

export const setup = new Path({
  base,
  params: {},
  hash: ["setup"]
});

export const calSetup = new Path({
  base,
  params: {},
  hash: ["cal-setup"]
});