/*
  Single event editor
*/

require("less/components/_event-editor.less");
require("less/components/_event-info.less");
import * as React from "react";
import * as classNames from "classnames";
import * as ApiT from "../lib/apiT";
import * as EventText from "../text/events";
import { ok, StoreData } from "../states/data-status";
import Dropdown from "./Dropdown";
import { confirmClasses } from "./EventConfirmBox";
import { Title, Time, Location, Description, GuestsSummary } from "./EventInfo";
import EventPlaceholder from "./EventPlaceholder";
import Icon from "./Icon";

export const EditorCls = "event-editor";

export interface Props {
  event: StoreData<ApiT.GenericCalendarEvent>|undefined;
  showDescription?: boolean;
  showGuests?: boolean;
  menu?: (event: ApiT.GenericCalendarEvent) => JSX.Element;
  children?: React.ReactNode|React.ReactNode[];
}

export const EventEditor = ({ event, menu, children, ...props }: Props) => {
  if (! ok(event)) {
    return <div className={EditorCls}>
      <h3>{ EventText.NotFound }</h3>
    </div>;
  }

  if (event === "FETCHING") {
    return <EventPlaceholder className={EditorCls} />;
  }

  let showDescription = typeof props.showDescription === "boolean" ?
    props.showDescription : true;
  let showGuests = typeof props.showGuests === "boolean" ?
    props.showGuests : true;

  return <div className={classNames(
    EditorCls,
    "event-info",
    confirmClasses(event)
  )}>
    { menu ? <Dropdown
      toggle={<button className="dropdown-toggle">
        <Icon type="options" />
      </button>}
      menu={menu(event)}
    /> : null }

    <h3><Title event={event} /></h3>
    <div className="block-info">
      <Time event={event} />
      <Location event={event} />
      { showGuests ? <GuestsSummary event={event} /> : null }
    </div>
    { showDescription ? <Description event={event} /> : null }
    { children }
  </div>;
}

export default EventEditor;
