import getTimezoneOffsetInMilliseconds from "date-fns-tz/getTimezoneOffset";

import { Weekday } from "~src/type/date.type";
import { Hour24, Minute } from "~src/type/time.type";
import { TimezoneName } from "~src/type/timezone.generated.type";
import { toWeekday } from "~src/util/date.util";

export const toMilitaryTime = (time: [Hour24, Minute]): number =>
  parseInt(`${`${time[0]}`.padStart(2, "0")}${`${time[1]}`.padStart(2, "0")}`, 10);

export const localTimeInRangePredicate =
  (_utcNowTime?: number) =>
  (
    timezoneName: TimezoneName,
    localTimeStart: [Hour24, Minute],
    localTimeEnd: [Hour24, Minute]
  ): boolean => {
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

    const offsetInMilliseconds = getTimezoneOffsetInMilliseconds(timezoneName);
    const localNow = new Date(utcNowTime + offsetInMilliseconds);
    const localNowTime = toMilitaryTime([
      localNow.getUTCHours() as Hour24,
      localNow.getUTCMinutes() as Minute
    ]);

    return localNowTime >= localStartTime && localNowTime <= localEndTime;
  };

export const zonesInTimeRangeGetter = (_utcNowTime?: number) => {
  const isLocalTimeInRange = localTimeInRangePredicate(_utcNowTime);
  return (localTimeStart: [Hour24, Minute], localTimeEnd: [Hour24, Minute]): TimezoneName[] => {
    return Object.values(TimezoneName).filter((timezoneName) =>
      isLocalTimeInRange(timezoneName, localTimeStart, localTimeEnd)
    );
  };
};

export const localDateGetter =
  (_utcNowTime?: number) =>
  (timezoneName: TimezoneName): string => {
    const utcNowTime =
      _utcNowTime !== undefined &&
      _utcNowTime !== null &&
      !Number.isNaN(_utcNowTime) &&
      Number.isFinite(_utcNowTime) &&
      _utcNowTime > 0
        ? _utcNowTime
        : new Date().getTime();

    const offsetInMilliseconds = getTimezoneOffsetInMilliseconds(timezoneName);
    const localNow = new Date(utcNowTime + offsetInMilliseconds);

    return [
      localNow.getUTCFullYear(),
      `${localNow.getMonth() + 1}`.padStart(2, "0"),
      `${localNow.getDate()}`.padStart(2, "0")
    ].join("-");
  };

export const localWeekdayGetter =
  (_utcNowTime?: number) =>
  (timezoneName: TimezoneName): Weekday => {
    const utcNowTime =
      _utcNowTime !== undefined &&
      _utcNowTime !== null &&
      !Number.isNaN(_utcNowTime) &&
      Number.isFinite(_utcNowTime) &&
      _utcNowTime > 0
        ? _utcNowTime
        : new Date().getTime();

    const offsetInMilliseconds = getTimezoneOffsetInMilliseconds(timezoneName);
    const localNow = new Date(utcNowTime + offsetInMilliseconds);

    return toWeekday(localNow.getDay());
  };
