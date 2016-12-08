import * as Paths from "./paths";
import { expect } from "chai";

describe("Group paths", function() {
  let pathname = "/groups";
  it("has eventList path", function() {
    expect(Paths.eventList.test({
      pathname, hash: "#!/event-list/myGroupId"
    })).to.deep.equal({
      groupId: "myGroupId"
    });
  });

  it("has setup path", function() {
    expect(Paths.setup.test({
      pathname, hash: "#!/setup"
    })).to.deep.equal({});
  });
});