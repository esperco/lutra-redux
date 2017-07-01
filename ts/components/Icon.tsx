/*
  Icon fonts can be problematic from an accessibility perspective. Also,
  hard-coding in a library specific label like "fa-close" for font-awesome
  makes harder to switch later.

  This component is a thin wrapper to help out and make it easier to change
  icons font labels later. Child elements will be appended after the icon
  if provided. Otherwise, we assume there is no textual label for this icon
  and we add one that is visible to screen-readers only.

  Usage:

    <Icon type="help" />

    <Icon type="edit">Edit Text<Icon>
*/

import * as React from "react";
import * as Text from "../text/common";
import * as LabelText from "../text/labels";

/*
  Icon names should be semantic. We can map these to appropriate classes
  for font-awesome or other libraries as appropriate.
*/
export const IconMappings = {
  "accounts": "fa-users",
  "add": "fa-plus",
  "agenda-check": "fa-check",
  "archive": "fa-archive",
  "calendar-check": "fa-calendar-check-o",
  "calendar-empty": "fa-calendar-o",
  "calendar": "fa-calendar-o",
  "caret-down": "fa-caret-down",
  "cancel": "fa-close",
  "charts": "fa-pie-chart",
  "check": "fa-check",
  "clear": "fa-close",
  "close": "fa-close",
  "comments": "fa-comment",
  "contact": "fa-envelope",
  "dismiss": "fa-close",
  "done": "fa-check",
  "edit": "fa-pencil",
  "filters": "fa-bars",
  "help": "fa-question-circle",
  "home": "fa-home",
  "info": "fa-info-circle",
  "label": "fa-tag",
  "labels": "fa-tags",
  "location": "fa-map-marker",
  "logout": "fa-sign-out",
  "next": "fa-chevron-right",
  "options": "fa-ellipsis-h",
  "options-h": "fa-ellipsis-h",
  "options-v": "fa-ellipsis-v",
  "people": "fa-users",
  "person": "fa-user",
  "privacy": "fa-lock",
  "previous": "fa-chevron-left",
  "ratings": "fa-star",
  "refresh": "fa-refresh",
  "remove": "fa-close",
  "repeat": "fa-clone",
  "save": "fa-check",
  "search": "fa-search",
  "settings": "fa-cog",
  "slack": "fa-slack",
  "terms": "fa-legal",
  "time": "fa-clock-o"
};

export type IconType = keyof (typeof IconMappings);

interface Props {
  type: IconType;
  children?: React.ReactNode;
}

// Default screen reader label only.
function getTextForIcon(icon: IconType): string {
  return {
    "accounts": Text.Accounts,
    "add": Text.Add,
    "agenda-check": Text.AgendaLink,
    "archive": Text.Archive,
    "calendar-check": Text.CalendarCheck,
    "calendar-empty": Text.CalendarEmpty,
    "calendar": Text.Calendar,
    "caret-down": "", // Intentionally blank, caret has no semantic meaning
    "cancel": Text.Cancel,
    "charts": Text.Charts,
    "check": Text.Check,
    "clear": Text.Clear,
    "close": Text.Close,
    "comments": Text.Comments,
    "contact": Text.Contact,
    "dismiss": Text.Dismiss,
    "done": Text.Done,
    "edit": Text.Edit,
    "filters": Text.Filters,
    "help": Text.Help,
    "home": Text.Home,
    "info": Text.Info,
    "label": LabelText.Label,
    "labels": LabelText.Labels,
    "location": Text.Location,
    "logout": Text.Logout,
    "next": Text.Next,
    "options": Text.Options,
    "options-h": Text.Options,
    "options-v": Text.Options,
    "people": Text.People,
    "person": Text.Person,
    "privacy": Text.Privacy,
    "previous": Text.Previous,
    "ratings": Text.RatingsLink,
    "refresh": Text.Refresh,
    "remove": Text.Remove,
    "repeat": Text.Repeat,
    "save": Text.Save,
    "search": Text.Search,
    "settings": Text.Settings,
    "slack": Text.Slack,
    "terms": Text.Terms,
    "time": Text.Time
  }[icon];
}

/*
  NB: An icon's label will be hidden as appropriate using CSS and
*/
function Icon({ type, children }: Props) {
  let hasChildren = React.Children.count(children || []) > 0;
  let classes = "icon-label";
  if (! hasChildren) { classes += " no-text"; }
  return <span className={classes}>
    <i className={"fa " + IconMappings[type]} />
    {
      hasChildren ?
      <span>{ children }</span> :
      <span className="sr-only">{ getTextForIcon(type) }</span>
    }
  </span>;
}

export default Icon;