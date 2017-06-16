/*
  Component for editing multiple events
*/

require("less/components/_event-editor.less");
import * as React from "react";
import * as ApiT from "../lib/apiT";
import { ok, StoreData } from "../states/data-status";
import * as EventText from "../text/events";
import Dropdown from "./Dropdown";
import { EditorCls } from "./EventEditor";
import Icon from "./Icon";

interface Props {
  events: (StoreData<ApiT.GenericCalendarEvent>|undefined)[];
  menu: (events: ApiT.GenericCalendarEvent[]) => JSX.Element;
  children: React.ReactNode|React.ReactNode[];
}

export const MultiEventEditor = ({ events, menu, children } : Props) => {
  let validEvents: ApiT.GenericCalendarEvent[] = [];
  let hasFetching = false;
  let hasHidden = false;
  events.forEach((e) => {
    if (ok(e)) {
      if (e === "FETCHING") {
        hasFetching = true;
      } else {
        validEvents.push(e);
        if (e.hidden) {
          hasHidden = true;
        }
      }
    }
  });

  if (! validEvents.length) {
    return <div className={EditorCls}>
      <h3>{ EventText.NotFound }</h3>
    </div>;
  }

  return <div className={EditorCls}>
    { menu ? <Dropdown
      toggle={<button className="dropdown-toggle">
        <Icon type="options" />
      </button>}
      menu={menu(validEvents)}
    /> : null }

    <h3>{ EventText.eventsSelected(validEvents.length) }</h3>

    { children }
  </div>;
}

export default MultiEventEditor;
