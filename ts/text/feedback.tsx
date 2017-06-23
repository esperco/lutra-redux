import * as React from "react";
import Icon from "../components/Icon";

export const FeedbackDefault = <span>
  Ask for feedback by default for meetings that meet <em>all</em> of
  the following conditions:
</span>;
export const MinGuests =
  "Minimum number of guests";
export const MaxGuests =
  "Maximum number of guests";
export const RecurringOnly =
  "Recurring events only";
export const SameDomainOnly =
  "Internal meetings only (all attendees share the same email domain)"

export const FeedbackOn = "Request feedback?";

export const FBExpiredShort = "Some events not shown";

export const FBExpiredLong = "Esper sends feedback requests at the end of " +
  "a meeting. Events that have already ended may not be shown.";

export const FBSettingsMsg = (p: { settingsHref: string }) => <span>
  Tip: Want to request feedback by default for certain types of events?
  Access the <a href={p.settingsHref}>settings page</a> via
  the <Icon type="options-v" /> icon in the upper right corner.
</span>;

interface DefaultDescriptionProps {
  settingsHref: string;
  minGuests: number;
  maxGuests: number;
  recurring: boolean;
  sameDomain: boolean;
}
export const DefaultDescriptionSetup =
(p: DefaultDescriptionProps) => <p className="description">
  Esper defaults to asking for feedback for
  all {p.recurring ? "recurring" : ""} meetings
  with {p.minGuests} - {p.maxGuests} guests{p.sameDomain ?
    " if all attendees share the same email domain" : ""
  }. You can change this on a per-event basis or change the defaults by going
  to the <a href={p.settingsHref}>settings&nbsp;page</a> via
  the <Icon type="options-v" /> icon in the upper right corner.
</p>;
