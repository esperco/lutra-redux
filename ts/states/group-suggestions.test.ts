import { expect } from "chai";
import { initState, suggestReducer } from "./group-suggestions";
import { testLabel } from "../fakes/labels-fake";
import { deepFreeze } from "../lib/util";

describe("suggestReducer", () => {
  const groupId = "group-id";
  const label1 = testLabel("Label 1");
  const label2 = testLabel("Label 2");
  const guest1 = { email: "email1@example.com" };
  const guest2 = { email: "email2@example.com" };

  const s1 = {
    ...initState(),
    groupLabelSuggestions: {
      [groupId]: {
        [label1.normalized]: label1
      }
    },
    groupGuestSuggestions: {
      [groupId]: {
        [guest1.email]: guest1
      }
    }
  };

  it("adds suggested labels", () => {
    let s2 = suggestReducer(deepFreeze(s1), {
      type: "GROUP_SUGGESTIONS",
      groupId,
      labels: { [label2.normalized]: label2 }
    });
    expect(s2.groupLabelSuggestions[groupId]).to.deep.equal({
      [label1.normalized]: label1,
      [label2.normalized]: label2
    });
  });

  it("adds suggested guests", () => {
    let s2 = suggestReducer(deepFreeze(s1), {
      type: "GROUP_SUGGESTIONS",
      groupId,
      guests: { [guest2.email]: guest2 }
    });
    expect(s2.groupGuestSuggestions[groupId]).to.deep.equal({
      [guest1.email]: guest1,
      [guest2.email]: guest2
    });
  });
});