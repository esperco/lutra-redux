import { expect } from "chai";
import { Period, fromDates, bounds } from "./period";
import * as moment from "moment";

describe("Period", function() {
  describe("fromDates", function() {
    it("should return multiple periods if necessary", function() {
      expect(fromDates("week",
        new Date(1970, 0, 1),
        new Date(1970, 0, 12)
      )).to.deep.equal({
        interval: "week",
        start: 0,
        end: 2
      });
    });

    it("should return a single period if sufficient", function() {
      expect(fromDates("week",
        new Date(1970, 0, 6),
        new Date(1970, 0, 8)
      )).to.deep.equal({
        interval: "week",
        start: 1,
        end: 1
      });
    });
  });

  describe("bounds", function() {
    it("should return start and end dates for a period", function() {
      // Feb 2016
      var period: Period = { interval: "month", start: 553, end: 553 };
      expect(bounds(period)).to.deep.equal([
        new Date(2016, 1, 1),
        new Date(2016, 1, 29, 23, 59, 59, 999)
      ]);
    });

    it("should handle week boundaries properly", function() {
      // NB: We should make this test locale independent, but for now, we
      // assume that the week starts on Sunday
      var localeData: any = moment.localeData();
      expect(localeData.firstDayOfWeek()).to.equal(0);

      var period: Period = { interval: "week", start: 1, end: 1 };
      expect(bounds(period)).to.deep.equal([
        new Date(1970, 0, 4),
        new Date(1970, 0, 10, 23, 59, 59, 999)
      ]);
    });
  });
});

