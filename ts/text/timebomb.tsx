import * as moment from "moment"
import * as React from "react";
import Icon from "../components/Icon";

export const TimebombDefault = <span>
  Activate Sweep by default for meetings that meet <em>all</em> of
  the following conditions:
</span>;
export const TimebombMinGuests =
  "Minimum number of guests";
export const TimebombMaxGuests =
  "Maximum number of guests";
export const RecurringOnly =
  "Recurring events only";
export const SameDomainOnly =
  "Internal meetings only (all attendees share the same email domain)"

export const TBSettingsMsg = <span>
  Tip: Want to change which events Sweep cancels by default?
  Access the Settings page via the <Icon type="accounts" /> in the
  upper right corner.
</span>;

export const SetTimebomb = "Require Agenda?";
export const ConfirmYes = "Has Agenda";
export const ConfirmNo = "No Agenda";
export const HelpLink = "What is this?";
export const TimebombLate = "Time to change preference has expired";
export const Canceled = "Meeting canceled";
export const Confirmed = "Meeting confirmed";
export const ConfirmLate = "Confirmation period has expired";

export const OnboardingPickEventHeading =
  "Pick an Event";
export const OnboardingPickEventDescription = <div>
  <p>
    Select "{SetTimebomb}" for an event that should require an agenda.
  </p>
</div>;

export const onboardingNoContent =
  (href: string) => <div className="no-content-msg">
    Missing calendar events? You may need to share additional calendars
    with Esper. <a href={href}>
      Go back to the calendar selection page.
    </a>
  </div>;

export const Stage0OnDescription = (t: string|Date|moment.Moment) => <div>
  <p>
    Got it. We'll send out an email on
    {" "}<strong>{ moment(t).format("MMMM Do")}</strong>{" "}
    at <strong>{ moment(t).format("h:mm a") }</strong> to
    the people attending this event to confirm if there's an agenda.
    If there's no agenda, we'll cancel the meeting one hour before and let
    everyone know. Otherwise, the meeting will proceed as planned.
  </p>

  <p>
    You can also toggle the switch if you don't want us to send the email.
  </p>
</div>;

export const Stage0OffDescription = () => <div>
  <p>
    OK. We won't send an email for this meeting.
  </p>
</div>;

export const Stage1OnDescription = (t: string|Date|moment.Moment) => <div>
  <p>
    Got it. If no one opts to keep this meeting
    within <strong>{moment(t).fromNow(true)}</strong>, we'll cancel it and
    let everyone know via email.
  </p>

  <p>
    Toggle the switch to prevent Esper from canceling this meeting.
  </p>
</div>;

export const Stage1OffDescription = (t: string|Date|moment.Moment) => <div>
  <p>
    Thanks. This meeting is confirmed. If you change your mind, you can still
    toggle the switch within {moment(t).fromNow(true)}.
  </p>
</div>;

export const Stage2ConfirmedDescription = () => <p>
  The confirmation period has expired. This meeting has been confirmed.
</p>;

export const Stage2CancelledDescription = () => <p>
  The confirmation period has expired. This meeting has been canceled.
</p>;

interface DefaultDescriptionProps {
  settingsHref: string;
  minGuests: number;
  maxGuests: number;
  recurring: boolean;
  sameDomain: boolean;
}
export const DefaultDescriptionSetup =
(p: DefaultDescriptionProps) => <p className="description">
  Esper will default to requiring agendas for
  all {p.recurring ? "recurring" : ""} meetings
  with {p.minGuests} - {p.maxGuests} guests{p.sameDomain ?
    " if all attendees share the same email domain" : ""
  }. You can change this on a per-event basis or change the defaults on
  the <a href={p.settingsHref}>settings page</a>.
</p>;

export const LandingCTAButton = "Cancel More Meetings";
