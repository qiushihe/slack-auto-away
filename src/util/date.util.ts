import { Weekday } from "~src/type/date.type";

export const toWeekday = (weekday: number): Weekday => {
  if (weekday === 0) {
    return Weekday.Sunday;
  } else if (weekday === 1) {
    return Weekday.Monday;
  } else if (weekday === 2) {
    return Weekday.Tuesday;
  } else if (weekday === 3) {
    return Weekday.Wednesday;
  } else if (weekday === 4) {
    return Weekday.Thursday;
  } else if (weekday === 5) {
    return Weekday.Friday;
  } else if (weekday === 6) {
    return Weekday.Saturday;
  } else {
    throw new Error(`Unknown weekday: ${weekday}`);
  }
};
