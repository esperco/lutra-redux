import * as ApiT from "../lib/apiT";

export default function makeCalendar(
  props: Partial<ApiT.GenericCalendar> = {}
): ApiT.GenericCalendar {
  return {
    id: "cal-id",
    title: "My Calendar",
    ...props
  };
}