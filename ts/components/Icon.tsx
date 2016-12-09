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
type IconType =
  "accounts"
  |"cancel"
  |"close"
  |"contact"
  |"dismiss"
  |"edit"
  |"filters"
  |"help"
  |"home"
  |"logout"
  |"privacy"
  |"save"
  |"settings"
  |"terms";

interface Props {
  type: IconType;
  children?: JSX.Element|JSX.Element[]|string;
}

function getClassForIcon(icon: IconType): string {
  switch(icon) {
    case "accounts":
      return "fa-users";
    case "cancel":
      return "fa-close";
    case "close":
      return "fa-close";
    case "contact":
      return "fa-envelope";
    case "dismiss":
      return "fa-close";
    case "edit":
      return "fa-pencil";
    case "filters":
      return "fa-bars";
    case "help":
      return "fa-question-circle";
    case "home":
      return "fa-home"
    case "logout":
      return "fa-sign-out";
    case "privacy":
      return "fa-lock";
    case "save":
      return "fa-check";
    case "settings":
      return "fa-cog";
    case "terms":
      return "fa-legal"
  }
}

// Default screen reader label only.
function getLabelForIcon(icon: IconType): string {
  switch(icon) {
    case "accounts":
      return Text.Accounts;
    case "cancel":
      return Text.Cancel;
    case "close":
      return Text.Close;
    case "contact":
      return Text.Contact;
    case "dismiss":
      return Text.Dismiss;
    case "edit":
      return Text.Edit;
    case "filters":
      return Text.Filters;
    case "help":
      return Text.Help;
    case "home":
      return Text.Home;
    case "logout":
      return Text.Logout;
    case "privacy":
      return Text.Privacy;
    case "save":
      return Text.Save;
    case "settings":
      return Text.Settings;
    case "terms":
      return Text.Terms;
  }
}

/*
  NB: An icon's label will be hidden as appropriate using CSS and
*/
function Icon({ type, children }: Props) {
  let hasChildren = React.Children.count(children || []) > 0;
  let classes = "icon-label";
  if (! hasChildren) { classes += " no-text"; }
  return <span className={classes}>
    <i className={"fa " + getClassForIcon(type)} />
    {
      hasChildren ?
      <span>{ children }</span> :
      <span className="sr-only">{ getLabelForIcon(type) }</span>
    }
  </span>;
}

export default Icon;