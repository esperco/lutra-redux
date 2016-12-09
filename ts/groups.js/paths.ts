import { Path, StringParam } from "../lib/routing";

const base = "/groups";

export const eventList = new Path({
  base,
  params: {
    groupId: StringParam,
  },
  hash: ["event-list", ":groupId"]
});

export const setup = new Path({
  base,
  params: {},
  hash: ["setup"]
});
