import { Path, StringParam, BooleanParam } from "../lib/routing";
import { PeriodParam } from "../lib/period";

export const base = "/tb";

export const events = new Path({
  base,
  params: {},
  optParams: {
    period: PeriodParam,
    onboarding: BooleanParam,
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

export const pickEventSetup = new Path({
  base,
  params: {},
  optParams: {
    period: PeriodParam,
    eventId: StringParam // For next
  },
  hash: ["setup", "events"]
});

export const slackSetup = new Path({
  base,
  params: {},
  hash: ["setup", "slack"]
});