import { Path } from "../lib/routing";

const base = "/groups";

export const eventList = new Path({
  base,
  params: {groupId: "" as string},
  hash: ["event-list", ":groupId"]
});

export const setup = new Path({
  base,
  params: {},
  hash: ["setup"]
});
