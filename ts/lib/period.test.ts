import { expect } from "chai";
import {
  GenericPeriod, fromDates, bounds, add, toDays, PeriodParam
} from "./period";
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

    it("should guess single month intervals if no interval provided", () => {
      expect(fromDates(
        new Date("2016-10-01"),
        new Date("2016-10-31")
      )).to.deep.equal({
        interval: "month",
        start: 561,
        end: 561
      });
    });

    it("should guess multi-month intervals if no interval provided", () => {
      expect(fromDates(
        new Date("2016-10-01"),
        new Date("2016-11-30")
      )).to.deep.equal({
        interval: "month",
        start: 561,
        end: 562
      });
    });

    it("should fall back to day if no other interval makes sense", () => {
      expect(fromDates(
        new Date("2016-10-11"),
        new Date("2016-10-20")
      )).to.deep.equal({
        interval: "day",
        start: 17085,
        end: 17094
      });
    });
  });

  describe("bounds", function() {
    it("should return start and end dates for a period", function() {
      // Feb 2016
      var period: GenericPeriod = { interval: "month", start: 553, end: 553 };
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

      var period: GenericPeriod = { interval: "week", start: 1, end: 1 };
      expect(bounds(period)).to.deep.equal([
        new Date(1970, 0, 4),
        new Date(1970, 0, 10, 23, 59, 59, 999)
      ]);
    });
  });

  describe("toDays", function() {
    it("converts non-day periods into days", () => {
      expect(toDays({
        interval: "week", start: 100, end: 100
      })).to.deep.equal({
        interval: "day", start: 696, end: 702
      });
    });
  });

  describe("add", function() {
    it("should increment period multiple intervals", function() {
      expect(
        add({ interval: "week", start: 121, end: 123 }, 2)
      ).to.deep.equal({
        interval: "week", start: 127, end: 129
      });
    });

    it("should decrement period multiple intervals", function() {
      expect(
        add({ interval: "week", start: 127, end: 129 }, -2)
      ).to.deep.equal({
        interval: "week", start: 121, end: 123
      });
    });
  });

  describe("PeriodParam", () => {
    it("stringifies and de-stringifies values", () => {
      let val: GenericPeriod = {
        interval: "week", start: 1000, end: 1003
      };
      let str = PeriodParam.toStr(val);
      expect(PeriodParam.clean(str)).to.deep.equal(val);
    });

    it("returns null when cleaning gibberish", () => {
      expect(PeriodParam.clean("asdfasdf")).to.be.null;
      expect(PeriodParam.clean("m,100,99")).to.be.null;
      expect(PeriodParam.clean("m,100,NaN")).to.be.null;
      expect(PeriodParam.clean("m,100,Infinity")).to.be.null;
    });
  })
});

