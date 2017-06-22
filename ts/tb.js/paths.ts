import { Path, StringParam } from "../lib/routing";
import { PeriodParam } from "../lib/period";

export const base = "/tb";

export const events = new Path({
  base,
  params: {},
  optParams: {
    period: PeriodParam,
    eventId: StringParam
  },
  hash: ["events"]
});

export const setup = new Path({
  base,
  params: {},
  hash: ["setup"]
});

export const calSetup = new Path({
  base,
  params: {},
  hash: ["setup", "cal"]
});

export const activate = new Path({
  base,
  params: {},
  hash: ["setup", "activate"]
});

export const slackSetup = new Path({
  base,
  params: {},
  hash: ["setup", "slack"]
});