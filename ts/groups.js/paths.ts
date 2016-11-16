import { Path } from "../lib/routing";

const base = "/groups.html#!";

export const eventList = new Path({
  base,
  params: {},
  query: {},
  toStr: (p) => "/event-list"
});

export const setup = new Path({
  base,
  params: {},
  query: {},
  toStr: (p) => "/setup"
});
