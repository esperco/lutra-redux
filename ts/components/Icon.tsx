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

/*
  Icon names should be semantic. We can map these to appropriate classes
  for font-awesome or other libraries as appropriate.
*/
export const IconMappings = {
  "accounts": "fa-users",
  "cancel": "fa-close",
  "close": "fa-close",
  "contact": "fa-envelope",
  "dismiss": "fa-close",
  "edit": "fa-pencil",
  "filters": "fa-bars",
  "help": "fa-question-circle",
  "home": "fa-home",
  "location": "fa-map-marker",
  "logout": "fa-sign-out",
  "next": "fa-chevron-right",
  "privacy": "fa-lock",
  "previous": "fa-chevron-left",
  "refresh": "fa-refresh",
  "repeat": "fa-refresh",
  "save": "fa-check",
  "settings": "fa-cog",
  "terms": "fa-legal"
};

export type IconType = keyof (typeof IconMappings);

interface Props {
  type: IconType;
  children?: JSX.Element|JSX.Element[]|string;
}

// Default screen reader label only.
function getLabelForIcon(icon: IconType): string {
  return {
    "accounts": Text.Accounts,
    "cancel": Text.Cancel,
    "close": Text.Close,
    "contact": Text.Contact,
    "dismiss": Text.Dismiss,
    "edit": Text.Edit,
    "filters": Text.Filters,
    "help": Text.Help,
    "home": Text.Home,
    "location": Text.Location,
    "logout": Text.Logout,
    "next": Text.Next,
    "privacy": Text.Privacy,
    "previous": Text.Previous,
    "refresh": Text.Refresh,
    "repeat": Text.Repeat,
    "save": Text.Save,
    "settings": Text.Settings,
    "terms": Text.Terms
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
      <span className="sr-only">{ getLabelForIcon(type) }</span>
    }
  </span>;
}

export default Icon;