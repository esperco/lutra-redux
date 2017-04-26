/*
  Error messages for which we have user-friendly text
*/

import * as React from "react";
import { ErrorDetails } from "../lib/errors";

export function getText(code: number, details?: ErrorDetails) {
  // Check more detailed tag messages first
  switch (details && details.tag) {
    case "Missing_payment_source":
    case "Stripe_canceled_subscription":
    case "Payment_required":
      return "We're having trouble billing your account. Please " +
             "update your payment information.";

    case "Expired_link":
    case "Invalid_token":
    case "Expired_token":
      return InvalidToken;
  }

  // Fall back to error codes
  if (code === 401) {
    return "We're having trouble authenticating you. " +
           "Please try logging out and logging in again."
  } else if (code === 403) {
    return "I'm sorry. I'm afraid I can't do that. " +
           "Please try logging out and logging in again.";
  } else if (code === 503) {
    return "We're temporarily down for maintenance. " +
           "Please try refreshing in a minute."
  }

  // Default message
  return GenericError;
}

export const GenericError = "Whoops. Something broke.";

export const InvalidToken = "That link is no longer valid.";

export const ContactText = <span>
  Contact us
  at <a href="https://esper.com/contact">esper.com/contact</a> for help.
</span>;

export const GenericErrorMsg = <div>
  { GenericError } { ContactText }
</div>;
