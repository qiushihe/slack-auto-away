export const INDEX_PREFIX = "_index/";

export enum IndexName {
  HAS_AUTH = "HAS_AUTH",
  HAS_TIMEZONE = "HAS_TIMEZONE",
  HAS_SCHEDULE = "HAS_SCHEDULE"
}

export const USER_DATA_PREFIX = "_userData/";

export type UserSchedule = {
  timeAuto: string;
  timeAway: string;
  disableSaturdaySchedule: boolean;
  differentSaturdaySchedule: boolean;
  saturdayTimeAuto: string;
  saturdayTimeAway: string;
  disableSundaySchedule: boolean;
  differentSundaySchedule: boolean;
  sundayTimeAuto: string;
  sundayTimeAway: string;
  exceptionDates: string[];
  pauseUpdates: boolean;
};

export type UserData = {
  userId: string;
  authToken?: string;
  timezoneName?: string;
  schedule?: UserSchedule;
};
