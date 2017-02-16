/*
  Misc paths that don't go anywhere else
*/
import { Path, StringParam } from "../lib/routing";

const base = "/now";

export const Home = new Path({ base });

export const Event = new Path({
  base,
  params: {
    eventId: StringParam
  },
  optParams: {
    team: StringParam
  },
  hash: ["event", ":eventId"]
});

