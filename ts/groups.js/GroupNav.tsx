/*
  This is the main view for the group page
*/
import * as React from 'react';
import * as Paths from "./paths";

export default function GroupNav({}: {}) {
  return <div>
    <a href={Paths.eventList.href({
      groupId: "default",
      showFilters: false, eventId: ""
    })}>
      Event List
    </a> | <a href={Paths.setup.href({})}>
      Setup
    </a>
  </div>;
}