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
