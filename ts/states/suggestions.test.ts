import { expect } from "chai";
import { initState, suggestReducer } from "./suggestions";
import { testLabel } from "../fakes/labels-fake";
import { deepFreeze } from "../lib/util";

describe("suggestReducer", () => {
  const calgroupId = "group-id";
  const label1 = testLabel("Label 1");
  const label2 = testLabel("Label 2");
  const guest1 = { email: "email1@example.com" };
  const guest2 = { email: "email2@example.com" };

  const s1 = {
    ...initState(),
    labelSuggestions: {
      [calgroupId]: {
        [label1.normalized]: label1
      }
    },
    guestSuggestions: {
      [calgroupId]: {
        [guest1.email]: guest1
      }
    }
  };

  it("adds suggested labels", () => {
    let s2 = suggestReducer(deepFreeze(s1), {
      type: "SUGGESTIONS",
      calgroupId,
      labels: { [label2.normalized]: label2 }
    });
    expect(s2.labelSuggestions[calgroupId]).to.deep.equal({
      [label1.normalized]: label1,
      [label2.normalized]: label2
    });
  });

  it("adds suggested guests", () => {
    let s2 = suggestReducer(deepFreeze(s1), {
      type: "SUGGESTIONS",
      calgroupId,
      guests: { [guest2.email]: guest2 }
    });
    expect(s2.guestSuggestions[calgroupId]).to.deep.equal({
      [guest1.email]: guest1,
      [guest2.email]: guest2
    });
  });
});