import { Path } from "../lib/routing";

const base = "/groups.html";

export const eventList = new Path({
  base,
  params: {groupId: ""},
  hash: ["event-list", ":groupId"]
});

export const setup = new Path({
  base,
  params: {},
  hash: ["setup"]
});
