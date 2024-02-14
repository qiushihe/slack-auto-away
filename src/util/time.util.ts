import { Hour24, Minute } from "~src/type/time.type";

export const to12Hour = (time24Hour: string) => {
  const [hour24, minutes] = time24Hour.split(":", 2).map((part) => parseInt(part, 10)) as [
    number,
    number
  ];
  const hour12 = hour24 > 12 ? hour24 - 12 : hour24;
  const suffix12 = hour24 >= 12 ? "pm" : "am";

  return `${hour12.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}${suffix12}`;
};

export const verboseRange = (fromTime24Hour: string, toTime24Hour: string): string =>
  [
    `${to12Hour(fromTime24Hour)} to ${to12Hour(toTime24Hour)}`,
    `(${fromTime24Hour} to ${toTime24Hour})`
  ].join(" ");

export const addMinutes = (baseTime: string, minutes: number): [Hour24, Minute] => {
  const baseTime24 = baseTime
    .split(":", 2)
    .map((part) => part.replace(/^0/, ""))
    .map((part) => parseInt(part, 10)) as [Hour24, Minute];

  const totalMinutes = baseTime24[0] * 60 + baseTime24[1] + minutes;
  const newHours = Math.floor((totalMinutes / 60) % 24);

  return [
    (newHours < 0 ? 24 + newHours : newHours) as Hour24,
    Math.floor(((totalMinutes % 60) + 60) % 60) as Minute
  ];
};
