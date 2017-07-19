import * as React from "react";
import * as ApiT from "../lib/apiT";
import Icon from "../components/Icon";

export const ActivateHeading = "Meeting Ratings";
export const ActivateSubheading = <span>
  Give feedback. Make meetings better. Repeat.
</span>;
export const ExplainerText1 = <p>
  At the end of each meeting you enable Ratings for, Esper sends an email or
  Slack message asking meeting attendees to rate the&nbsp;meeting.
</p>;
export const ExplainerText2 = <p>
  Each attendee can anonymously leave star ratings or
  other&nbsp;feedback.
</p>;
export const ExplainerText3 = <p>
  24 hours later, Esper sends a feedback summary email to the meeting
  organizer, who can use the feedback to improve future&nbsp;meetings.
</p>;

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

export const FeedbackLate = "Time to change preference has expired";
export const FeedbackOn = "Request ratings?";

export const FBExpiredShort = "Some events not shown";

export const FBExpiredLong = "Esper sends feedback requests at the end of " +
  "a meeting. Events that have already ended or are close to ending " +
  "may not be shown.";

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
  Ratings has been enabled for
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
export const PostiveTags: {
  [K in keyof ApiT.PositiveFeedbackTags]: string;
} = {
  agenda: "Had Agenda",
  on_time: "On Time",
  good_time_mgmt: "Good Time Management",
  contributed: "I Contributed",
  action_items: "Had Action Items"
};

export const NegativeButtonLabel = "What needs improvement?";
export const NegativeTags: {
  [K in keyof ApiT.NegativeFeedbackTags]: string;
} = {
  no_agenda: "No Agenda",
  started_late: "Started Late",
  poor_time_mgmt: "Poor Time Management",
  guest_not_needed: "I Wasn't Needed",
  no_action_items: "No Action Items"
};

export const IsOrganizer = "I am the meeting organizer.";
export const IsOrganizerTooltip =
  "Meeting organizers will receive a meeting feedback summary via email.";
export const DidntAttend = "I didn't attend.";

export const TextFeedbackLabel =
  "Anything other feedback for the meeting organizer?";
export const BlurbPlaceholder = "Optional feedback";

const onOff = (v: boolean) => v ? "on" : "off";
export const RecurringDescription = (v: boolean) =>
  `Ratings are ${onOff(v)} for all recurrences of this event.`;
export const InstanceDescription = (v: boolean) =>
  `Ratings are ${onOff(v)} for only this event, not its recurrences.`;
export const SwitchToInstance = "Toggle ratings for this event only?";