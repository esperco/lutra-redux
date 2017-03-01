import * as React from 'react';

export const TimebombEnable =
  "Enable \"move to email\" for meetings by default";
export const TimebombDescribe = <p>
  2-4 days before a meeting, Esper will send an e-mail to all meeting guests
  asking them to confirm that they want to attend. If no one confirms, Esper
  will remove the meeting from everyone's calendar 24 hours before the event
  and send an e-mail to all guests that the meeting has been "moved to email".
  If at least one person confirms, the meeting will proceed as planned.
</p>;
export const TimebombMinGuests =
  "Minimum number of guests in event to activate by default";
export const TimebombMaxGuests =
  "Maximum number of guests in event to activate by default";

export const TimebombHeader = "Your Vote";
export const TimebombOn = "Email";
export const TimebombOff = "In Person";
export const TimebombLate = "Voting period has expired";
export const Canceled = "Meeting canceled (moved to email)";
export const Confirmed = "Meeting confirmed (in person)";
export const ConfirmLate = "Confirmation period has expired";
export const PendingConfirmation = "Pending confirmation (check your email)";

export const Onboarding1 =
  "Esper gets rid of wasteful meetings on your calendar.";
export const Onboarding2 =
  "We'll send emails to all guests beforehand: \"Is this meeting still on?\"";
export const Onboarding3 =
  "If nobody says \"Yes, it is still on\", then we'll move this meeting to " +
  "email. Time saved!";

export const TimebombHelpHeader = "Move to Email";

