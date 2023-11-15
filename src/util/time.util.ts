export const stringifyNormalizedTime = (hour24: number): [string, string] => {
  const hour12 = hour24 > 12 ? hour24 - 12 : hour24;
  const suffix12 = hour24 >= 12 ? "pm" : "am";
  return [
    `${hour24.toString().padStart(2, "0")}:00`,
    `${hour12.toString().padStart(2, "0")}:00${suffix12}`
  ];
};
