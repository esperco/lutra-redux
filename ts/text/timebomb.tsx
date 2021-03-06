import * as moment from "moment"
import * as React from "react";
import Icon from "../components/Icon";

export const ActivateHeading = "Agenda Check";
export const ActivateSubheading = <span>
  Know why you're meeting. Get stuff done.
</span>;
export const ExplainerText1 = <p>
  24 hours before each meeting you enable Agenda Check for, Esper sends an
  email or Slack message to meeting guests asking if they have any
  agenda&nbsp;items.
</p>;
export const ExplainerText2 = <p>
  Each guest tells Esper what they want to discuss at the&nbsp;meeting.
</p>;
export const ExplainerText3 = <p>
  Esper collects the agenda items and sends out a unified agenda
  one hour before the meeting.
</p>;
export const ActivateCTA = "Enable Agenda Check";

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
  Agenda check has been enabled for
  all {p.recurring ? "recurring" : ""} meetings
  with {p.minGuests} - {p.maxGuests} guests{p.sameDomain ?
    " if all attendees share the same email domain" : ""
  } by default. You can change this on a per-event basis below or
  change the defaults by going to
  the <a href={p.settingsHref}>settings&nbsp;page</a> via
  the <Icon type="options-v" /> icon in the upper right corner.
</p>;

export const BlurbPlaceholder = "What do you want to discuss?";

const onOff = (v: boolean) => v ? "on" : "off";
export const RecurringDescription = (v: boolean) =>
  `Agenda Check is ${onOff(v)} for all recurrences of this event.`;
export const InstanceDescription = (v: boolean) =>
  `Agenda Check is ${onOff(v)} for only this event, not its recurrences.`;
export const SwitchToInstance =
  "Toggle Agenda Check for this event only?";