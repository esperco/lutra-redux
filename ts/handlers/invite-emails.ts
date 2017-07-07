/*
  Fetch invite emails
*/
import { ApiSvc } from "../lib/api";
import { ok } from "../states/data-status";
import { UpdateInviteStateAction, InviteState } from "../states/invite-emails"

export function fetch(deps: {
  dispatch: (a: UpdateInviteStateAction) => void;
  state: InviteState;
  Svcs: ApiSvc
}): Promise<void> {
  // Update only if data blank
  if (ok(deps.state.inviteEmails)) {
    return Promise.resolve();
  }

  deps.dispatch({
    type: "UPDATE_INVITE_EMAILS",
    inviteEmails: "FETCHING"
  });

  return deps.Svcs.Api.getInviteEmails().then(({ emails }) => {
    let inviteEmails: Record<string, true> = {};
    emails.forEach((e) => {
      inviteEmails[e] = true;
    });

    deps.dispatch({
      type: "UPDATE_INVITE_EMAILS",
      inviteEmails
    });
  });
}