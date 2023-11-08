const ESCAPE_REG_EXP_EXP = new RegExp("[.*+?^${}()|[\\]\\\\]", "g");

export const escapeRegExp = (input: string): string => input.replace(ESCAPE_REG_EXP_EXP, "\\$&");
