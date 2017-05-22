import { Path, StringParam, BooleanParam } from "../lib/routing";
import { PeriodParam } from "../lib/period";

export const base = "/tb";

export const events = new Path({
  base,
  params: {},
  optParams: {
    period: PeriodParam,
    onboarding: BooleanParam
  },
  hash: ["events"]
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

export const eventDetailsSetup = new Path({
  base,
  params: {
    eventId: StringParam
  },
  optParams: {
    period: PeriodParam
  },
  hash: ["setup", "events", ":eventId"]
});

export const slackSetup = new Path({
  base,
  params: {},
  hash: ["setup", "slack"]
});