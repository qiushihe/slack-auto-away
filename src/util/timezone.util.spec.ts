import { beforeEach, describe, expect, it } from "@jest/globals";

import { Weekday } from "../type/date.type";
import { TimezoneName } from "../type/timezone.generated.type";
import {
  localDateGetter,
  localTimeInRangePredicate,
  localWeekdayGetter,
  zonesInTimeRangeGetter
} from "./timezone.util";

describe("util / timezone", () => {
  describe("localTimeInRangePredicate", () => {
    let utcNow: number;
    let isLocalTimeInRange: ReturnType<typeof localTimeInRangePredicate>;

    describe("at UTC midnight", () => {
      beforeEach(() => {
        utcNow = Date.UTC(2371, 8, 23, 0, 0, 0, 0);
        isLocalTimeInRange = localTimeInRangePredicate(utcNow);
      });

      it("should indicate if the given timezone is in the given time range", async () => {
        const isInRange = isLocalTimeInRange(TimezoneName.America__Regina, [17, 59], [18, 1]);

        // The "America/Regina" timezone would be at 6pm local time, when UTC is at midnight.
        // The "America/Regina" timezone also does not observe Daylight Savings.
        expect(isInRange).toEqual(true);
      });
    });
  });

  describe("zonesInTimeRangeGetter", () => {
    let utcNow: number;
    let getZonesInTimeRange: ReturnType<typeof zonesInTimeRangeGetter>;

    describe("at UTC midnight", () => {
      beforeEach(() => {
        utcNow = Date.UTC(2371, 8, 23, 0, 0, 0, 0);
        getZonesInTimeRange = zonesInTimeRangeGetter(utcNow);
      });

      it("should return names of timezone in the given time range", async () => {
        const timezoneNames = getZonesInTimeRange([17, 59], [18, 1]);

        // The "America/Regina" timezone would be at 6pm local time, when UTC is at midnight.
        // The "America/Regina" timezone also does not observe Daylight Savings.
        expect(timezoneNames).toContain(TimezoneName.America__Regina);
      });
    });
  });

  describe("localDateGetter", () => {
    let utcNow: number;
    let getLocalDate: ReturnType<typeof localDateGetter>;

    beforeEach(() => {
      utcNow = Date.UTC(2371, 8, 23, 0, 0, 0, 0);
      getLocalDate = localDateGetter(utcNow);
    });

    it("should return local date for a given timezone", async () => {
      const localDate = getLocalDate(TimezoneName.America__Regina);

      // The "America/Regina" timezone is behind UTC. So when UTC is at midnight, the
      // "America/Regina" would be at the day before.
      expect(localDate).toEqual("2371-09-22");
    });
  });

  describe("localWeekdayGetter", () => {
    let utcNow: number;
    let getLocalWeekday: ReturnType<typeof localWeekdayGetter>;

    beforeEach(() => {
      utcNow = Date.UTC(2024, 1, 13, 0, 0, 0, 0);
      getLocalWeekday = localWeekdayGetter(utcNow);
    });

    it("should return local weekday for a given timezone", async () => {
      const localWeekday = getLocalWeekday(TimezoneName.America__Regina);

      // The "America/Regina" timezone is behind UTC. So when UTC is at Tuesday, the
      // "America/Regina" would be at Monday.
      expect(localWeekday).toEqual(Weekday.Monday);
    });
  });
});
