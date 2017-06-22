import * as moment from "moment"
import * as React from "react";
import Icon from "../components/Icon";

export const TimebombDefault = <span>
  Ask for agenda items by default for meetings that meet <em>all</em> of
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

export const TBSettingsMsg = (p: { settingsHref: string }) => <span>
  Tip: Want to ask for agenda items by default for certain types of events?
  Access the <a href={p.settingsHref}>settings page</a> via
  the <Icon type="options-v" /> icon in the upper right corner.
</span>;

export const SetTimebomb = "Ask for Agenda Items?";
export const ConfirmYes = "Add to Agenda";
export const ConfirmNo = "Nothing to Add";
export const TimebombLate = "Time to change preference has expired";
export const ConfirmLate = "Time to edit agenda items has expired";

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
    the people attending this event to check if there's anything they
    want discussed. We'll send out a second email an hour before the
    meeting with agenda items.
  </p>

  <p>
    Close this message and toggle the checkbox if you
    don't want us to send the email.
  </p>
</div>;

export const Stage0OffDescription = () => <div>
  <p>
    OK. We won't check for agenda items for this meeting.
  </p>
</div>;

export const Stage1OnDescription = (t: string|Date|moment.Moment) => <div>
  <p>
    Got it. You're not listed on tomorrow's agenda. You can change
    your&nbsp;mind&nbsp;below.
  </p>
</div>;

export const Stage1OffDescription = (t?: string|Date|moment.Moment) => <div>
  <p>
    Confirmed. You've been added to tomorrow's agenda. Add more details
    or change your&nbsp;mind&nbsp;below.
  </p>
</div>;

export const Stage2ConfirmedDescription = () => <p>
  Sorry. We've already sent out the agenda email.
</p>;

export const Stage2CancelledDescription = () => <p>
  Sorry. We've already sent out an email saying there were no agenda items.
</p>;

export const TBTooSoonShort = "Some events not shown";

export const TBTooSoonLong = "Esper requests agenda items 24 hours before a " +
  "meeting begins. Events that are starting within the next 24 hours may " +
  "not be shown.";

interface DefaultDescriptionProps {
  settingsHref: string;
  minGuests: number;
  maxGuests: number;
  recurring: boolean;
  sameDomain: boolean;
}
export const DefaultDescriptionSetup =
(p: DefaultDescriptionProps) => <p className="description">
  Esper defaults to asking for agendas for
  all {p.recurring ? "recurring" : ""} meetings
  with {p.minGuests} - {p.maxGuests} guests{p.sameDomain ?
    " if all attendees share the same email domain" : ""
  }. You can change this on a per-event basis or change the defaults by going
  to the <a href={p.settingsHref}>settings&nbsp;page</a> via
  the <Icon type="options-v" /> icon in the upper right corner.
</p>;

export const BlurbPlaceholder = "What do you want to discuss?";

export const GoToSlackSetup = <span>One More Thing &hellip;</span>;
export const GoToSlackSetupDescription = <p>
  Prefer <a href="https://slack.com/">Slack</a> to email?
  Esper now supports Slack notifications!
</p>;
export const SlackSetupAction = "Connect to Slack";
export const SkipSlackAction = "Use Esper without Slack";
export const SlackSetupHeading = SlackSetupAction;
export const SlackSetupDescription = <p>
  Esper works better with Slack. Install our Esper bot to respond
  to agenda check notifications from wherever you are.
</p>;