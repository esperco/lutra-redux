import * as React from "react";
import Icon from "../components/Icon";

export const ActivateHeading = "Ratings";
export const ActivateDescription = <div>
  <p>
    Esper Ratings makes it easy for guests offer feedback to
    meeting organizers.
  </p>
  <p>
    With Ratings on, Esper will email your meeting guests when a
    meeting ends to ask how it went. We'll then send a second email to
    the meeting organizer 24 hours after that summarizing how your
    guests responded.
  </p>
</div>;
export const ActivateCTA = "Enable Ratings";

export const FeedbackDefault = <span>
  Ask for ratings by default for meetings that meet <em>all</em> of
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

export const FeedbackOn = "Request ratings?";

export const FBExpiredShort = "Some events not shown";

export const FBExpiredLong = "Esper sends feedback requests at the end of " +
  "a meeting. Events that have already ended may not be shown.";

export const FBSettingsMsg = (p: { settingsHref: string }) => <span>
  Tip: Want to request ratings by default for certain types of events?
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
  Ratings has been enabeld for
  all {p.recurring ? "recurring" : ""} meetings
  with {p.minGuests} - {p.maxGuests} guests{p.sameDomain ?
    " if all attendees share the same email domain" : ""
  } by default. You can change this on a per-event basis below or
  change the defaults by going to
  the <a href={p.settingsHref}>settings&nbsp;page</a> via
  the <Icon type="options-v" /> icon in the upper right corner.
</p>;

export const LandingQ = "How was this meeting?";
export const StarRatingsLabel = "Rate this meeting";
export const StarRatingsDescription = <p>
  Esper will aggregate ratings and send the average to the
  meeting organizer.
</p>;

export const PositiveButtonLabel = "Great! What went well?";
export const PostiveTags = {
  agenda: "Had Agenda",
  on_time: "On Time",
  good_time_mgmt: "Good Time Management",
  contributed: "I Contributed",
  presence_useful: "My Presence Was Useful",
  action_items: "Had Action Items"
};

export const NegativeButtonLabel = "What needs improvement?";
export const NegativeTags = {
  agenda: "No Agenda",
  on_time: "Started Late",
  good_time_mgmt: "Poor Time Management",
  contributed: "I Didn't Contribute",
  presence_useful: "I Wasn't Needed",
  action_items: "No Action Items"
};

export const IsOrganizer = "I am the meeting organizer.";
export const IsOrganizerTooltip =
  "Meeting organizers will receive a meeting feedback summary via email.";
export const DidntAttend = "I didn't attend.";

export const TextFeedbackLabel =
  "Anything other feedback for the meeting organizer?";
export const BlurbPlaceholder = "Optional feedback";