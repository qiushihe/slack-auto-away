import getTimezoneOffsetInMilliseconds from "date-fns-tz/getTimezoneOffset";

import { Hour24, Minute } from "~src/type/time.type";
import { TimezoneName } from "~src/type/timezone.generated.type";

export const toMilitaryTime = (time: [Hour24, Minute]): number =>
  parseInt(`${`${time[0]}`.padStart(2, "0")}${`${time[1]}`.padStart(2, "0")}`, 10);

export const zonesInTimeRangeGetter =
  (_utcNowTime?: number) =>
  (localTimeStart: [Hour24, Minute], localTimeEnd: [Hour24, Minute]): TimezoneName[] => {
    const utcNowTime =
      _utcNowTime !== undefined &&
      _utcNowTime !== null &&
      !Number.isNaN(_utcNowTime) &&
      Number.isFinite(_utcNowTime) &&
      _utcNowTime > 0
        ? _utcNowTime
        : new Date().getTime();

    const localStartTime = toMilitaryTime(localTimeStart);
    const localEndTime = toMilitaryTime(localTimeEnd);

    const timezoneOffsetInMillisecondsByName = Object.values(TimezoneName).reduce(
      (acc, timezoneName) => ({
        ...acc,
        [timezoneName]: getTimezoneOffsetInMilliseconds(timezoneName)
      }),
      {} as Record<TimezoneName, number>
    );

    const entriesInTimeRange = Object.entries(timezoneOffsetInMillisecondsByName).filter(
      ([, offsetInMilliseconds]) => {
        const localNow = new Date(utcNowTime + offsetInMilliseconds);
        const localNowTime = toMilitaryTime([
          localNow.getUTCHours() as Hour24,
          localNow.getUTCMinutes() as Minute
        ]);

        return localNowTime >= localStartTime && localNowTime <= localEndTime;
      }
    ) as [TimezoneName, number][];

    return entriesInTimeRange.map(([timezoneName]) => timezoneName);
  };
