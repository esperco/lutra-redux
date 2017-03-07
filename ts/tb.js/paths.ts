import { Path, BooleanParam } from "../lib/routing";
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
  optParams: {
    onboarding: BooleanParam
  },
  hash: ["settings"]
});

export const setup = new Path({
  base,
  params: {},
  hash: ["setup"]
});
