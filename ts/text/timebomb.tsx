import * as moment from "moment"
import * as React from "react";

export const TimebombMinGuests =
  "Minimum number of guests in event to activate by default";
export const TimebombMaxGuests =
  "Maximum number of guests in event to activate by default";

export const TimebombHeader = "Your Preference";
export const TimebombOn = "Cancel";
export const TimebombOff = "Keep";
export const TimebombLate = "Time to change preference has expired";
export const Canceled = "Meeting canceled (moved to email)";
export const Confirmed = "Meeting confirmed (in person)";
export const ConfirmLate = "Confirmation period has expired";
export const PendingConfirmation = "Pending confirmation (check email)";

export const Onboarding1 =
  "Esper gets rid of wasteful meetings on your calendar.";
export const Onboarding2 =
  "We'll send an email to all guests before the meeting asking if they " +
  "want to keep the meeting.";
export const Onboarding3 =
  "If nobody opts to kept the meeting, we cancel the meeting. Time saved!";

export const OnboardingPickEventHeading =
  "Pick an Event";
export const OnboardingPickEventDescription = <div>
  <p>
    Select the "{TimebombOn}" radio button next to an event you'd rather
    not attend.
  </p>
  <p>
    Don't worry. This won't cancel the meeting right away!
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
    the people attending this event asking if they want to keep this meeting.
    If no one says yes with 24 hours, we'll cancel the meeting and let
    everyone know. Otherwise, the meeting will proceed the planned.
  </p>

  <p>
    You can also toggle the radio button to "{TimebombOff}" if you don't
    want us to send the email.
  </p>
</div>;

export const Stage0OffDescription = () => <div>
  <p>
    OK. We won't send an email for this meeting. You can toggle the radio
    button back to "{TimebombOn}" if you change your mind.
  </p>
</div>;

export const Stage1OnDescription = (t: string|Date|moment.Moment) => <div>
  <p>
    We've sent an email to the people attending this event asking if they want
    to keep this meeting. If no one says yes within the
    next <strong>{moment(t).toNow(true)}</strong>, we'll cancel the meeting and
    let everyone know.
  </p>

  <p>
    Toggle the radio button to "{TimebombOff}" to prevent Esper from cancelling
    this meeting.
  </p>
</div>;

export const Stage1OffDescription = (t: string|Date|moment.Moment) => <div>
  <p>
    OK. This meeting is confirmed. If you change your mind, you can still
    toggle the radio button to "{TimebombOn}" within the
    next {moment(t).toNow(true)}.
  </p>
</div>;

export const Stage2ConfirmedDescription = () => <p>
  This meeting has been confirmed.
</p>;

export const Stage2CancelledDescription = () => <p>
  This meeting has been cancelled.
</p>;

export const TimebombDefault = "Cancel meetings by default";

interface DefaultDescriptionProps {
  settingsHref: string;
  minGuests: number;
  maxGuests: number;
}
export const TimebombDefaultDescription =
(p: DefaultDescriptionProps) => <p className="description">
  When set, Esper will default to "{TimebombOn}" for all meetings
  with {p.minGuests} - {p.maxGuests} guests. You can change this
  on a per-event basis or change the defaults on
  the <a href={p.settingsHref}>settings page</a>.
</p>;

export const TimebombHelpHeader = "Keep / Cancel";
