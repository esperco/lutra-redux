import * as Paths from "./paths";
import { expect } from "chai";

describe("Group paths", function() {
  let pathname = "/groups";

  describe("eventList", () => {
    it("exists", () => {
      expect(Paths.eventList.test({
        pathname, hash: "#!/event-list/myGroupId"
      })).to.deep.equal({
        groupId: "myGroupId",
      });
    });

    it("can specify showFilters", () => {
      expect(Paths.eventList.test({
        pathname, hash: "#!/event-list/myGroupId?showFilters=1"
      })).to.deep.equal({
        groupId: "myGroupId",
        showFilters: true
      });
    });

    it("can specify eventId", () => {
      expect(Paths.eventList.test({
        pathname, hash: "#!/event-list/myGroupId?eventId=abc"
      })).to.deep.equal({
        groupId: "myGroupId",
        eventId: "abc"
      });
    });

    it("can specify labels", () => {
      expect(Paths.eventList.test({
        pathname, hash: "#!/event-list/myGroupId?labels=0,1,a,b,c"
      })).to.deep.equal({
        groupId: "myGroupId",
        labels: {
          some: { a: true, b: true, c: true },
          none: true
        }
      });
    });
  });

  it("has setup path", function() {
    expect(Paths.setup.test({
      pathname, hash: "#!/setup"
    })).to.deep.equal({});
  });
});