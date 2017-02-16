import { Path, StringParam } from "../lib/routing";

const base = "/events";

export const event = new Path({
  base,
  params: {
    eventId: StringParam,
  },
  hash: ["event", ":eventId"]
});
