/*
  Store list of emails to auto-suggest for invites
*/

import { ready, StoreData } from "./data-status";

export interface InviteState {
  // Store as record so we can quickly merge / add new e-mails to this list
  inviteEmails?: StoreData<Record<string, true>>;
}

export interface UpdateInviteStateAction {
  type: "UPDATE_INVITE_EMAILS";
  inviteEmails: StoreData<Record<string, true>>;
}

/*
  Merges updates to inviteEmails state
*/
export function updateInviteStateReducer<S extends InviteState>(
  state: S, action: UpdateInviteStateAction
) {
  let inviteEmails = Object.assign({}, state.inviteEmails);

  // Actual data -> update
  if (ready(action.inviteEmails)) {
    if (ready(inviteEmails)) {
      inviteEmails = Object.assign({}, inviteEmails, action.inviteEmails);
    } else {
      inviteEmails = action.inviteEmails;
    }
  }

  // Else, update metadata state
  else if (! ready(inviteEmails)) {
    inviteEmails = action.inviteEmails;
  }

  return Object.assign({}, state, { inviteEmails });
}
