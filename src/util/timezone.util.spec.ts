import { beforeEach, describe, expect, it } from "@jest/globals";

import { zonesInTimeRangeGetter } from "./timezone.util";

describe("util / timezone", () => {
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
        expect(timezoneNames).toContain("America/Regina");
      });
    });
  });
});
