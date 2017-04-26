/*
  Login messages, errors, tokeb responses.
*/
import * as React from "react";
import * as ApiT from "../lib/apiT";
import * as Log from "../lib/log";

/*
  We translate a standardized shortcode into the acutal message to show to the
  user. We do this rather than include the message directly into the URL
  parameter to limit what an attacker can display when they send an Esper.com
  link to our users.
*/
export function message(code: string): string {
  switch (code) {
    case "slack_auth_success":
      return "Slack authentication successful.";
    case "deactivate":
      return "Your account has been deactivated.";
    case "reject_team":
      return "Thank you. We have temporarily locked your account while " +
             "we investigate and will get back to you shortly.";
    default:
      Log.e("Unsupported msg code " + code);
      return "Please login to continue.";
  }
}

// Like message, but for error codes
export function error(code: string): string {
  switch (code) {
    case "login_again":
      return "For security reasons, please log in again.";
    case "login_error":
      return "There was an error logging you in. Please try again.";
    case "slack_auth_failure":
      return "Slack authentication failed. Please try again.";
    case "preexisting_slack_user":
      return "That Slack account is tied to another user.";
    default:
      Log.e("Unsupported error code " + code);
      return "An error has occurred.";
  }
}

/*
  Token handling (this is for tokens that simply get consumed and display
  a message -- i.e. no Login tokens)
*/
export function token(info: ApiT.TokenResponse) {
  let tag = info.token_value[0];
  switch(tag) {
    /*
      These cases should not happen with current backend code. For teams,
      we should get an ?invite=token link rather than ?token=token link,
      which means the token would be passed to server via login rather than
      consumed here.

      Groups invites don't use tokens. Group members are auto-added as
      GIMs and are sent to the group settings page to add clanedars.

      If we get an old token, for fallback, just ask user to continue
      logging in.
    */
    case "Invite_join_team":
    case "Invite_join_group":
      return "Invite accepted. Please login to continue.";

    /*
      Timebomb tokens should not be processed here (see /sweep) but if
      they are for whatever reason, just display the appropriate message.
    */
    case "Confirm_timebomb_event":
      return "Meeting confirmed.";
    case "Unconfirm_timebomb_event":
      return "Meeting will be canceled if no one else confirms.";

    /*
      Email unsubscribe
    */
    case "Unsub_daily_agenda":
    case "Unsub_tasks_update":
    case "Unsub_label_reminder":
    case "Unsub_feedback_summary":
    case "Unsub_group_email":
    case "Unsub_ask_feedback":
    case "Unsub_timebomb":
      return "You've been unsubscribed from these emails.";

    /*
      Other cases are either obsolete, not supported yet, or not intended.
      Log error, but fail gracefully.
    */
    default:
      Log.e("Case not supported: " + tag);
      return "Please log in to continue.";
  }
}

export const NonceError = <span>
  There was an error logging you in. Esper requires cookies
  to function correctly. If you have disabled cookies, please try
  enabling them. If you are using Safari in Incognito or Private Mode,
  please try disabling it.
</span>;

export const DefaultLoginMsg = <span>
  Please log in with your calendar provider to continue.
</span>;

export const RedirectMsg = <span>
  Signing in &hellip;
</span>;

export const ApproveTeamsHeading = <span>
  You already have an Esper account
</span>;

export const ApproveTeamsDescription = <div>
  <p>
    Someone already created an account for you on Esper. This may be because
    because an assistant or team member started using Esper on your behalf.
  </p>
  <p>
    Please verify that the users below are authorized to use Esper on your
    behalf. If you do not recognize someone, please reject access and we
    will investigate. Approving unrecognized users may grant them access to
    your calendar and other private information.
  </p>
  <p>
    If you have questions or concerns, <a href="https://esper.com/contact">
      contact us for support
    </a>.
  </p>
</div>;

export const Approve = "Approve";
export const Reject = "Reject"

export const TOSNote = <p>
  By signing in, you agree to Esper&apos;s&nbsp;
  <a href="/terms-of-use">Terms&nbsp;of&nbsp;Use.</a>
</p>;

export const LogoutMsg = "You have been logged out";