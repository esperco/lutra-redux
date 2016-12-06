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
import * as _ from "lodash";

/*
  Icon names should be semantic. We can map these to appropriate classes
  for font-awesome or other libraries as appropriate.
*/
type IconType =
  "cancel"
  |"close"
  |"dismiss"
  |"edit"
  |"help"
  |"save";

interface Props {
  type: IconType;
  children?: JSX.Element|JSX.Element[]|string;
}

function getClassForIcon(icon: IconType): string {
  switch(icon) {
    case "cancel":
      return "fa-close";
    case "close":
      return "fa-close";
    case "dismiss":
      return "fa-close";
    case "edit":
      return "fa-pencil";
    case "help":
      return "fa-question-circle";
    case "save":
      return "fa-check";
  }
}

/*
  Default screen reader label only.
  TODO: Move label text to ../text somewhere.
*/
function getLabelForIcon(icon: IconType): string {
  return _.capitalize(icon);
}

/*
  NB: An icon's label will be hidden as appropriate using CSS and
*/
function Icon({ type, children }: Props) {
  return <span className="icon-label">
    <i className={"fa " + getClassForIcon(type)} />
    {
      React.Children.count(children || []) > 0 ?
      <span>{ children }</span> :
      <span className="sr-only">{ getLabelForIcon(type) }</span>
    }
  </span>;
}

export default Icon;