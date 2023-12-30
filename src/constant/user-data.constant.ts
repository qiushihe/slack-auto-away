export const INDEX_PREFIX = "_index/";

export enum IndexName {
  HAS_AUTH = "HAS_AUTH",
  HAS_TIMEZONE = "HAS_TIMEZONE",
  HAS_SCHEDULE = "HAS_SCHEDULE"
}

export const USER_DATA_PREFIX = "_userData/";

export type UserData = {
  userId: string;
  authToken?: string;
  timezoneName?: string;
  scheduleFromHour24?: number;
  scheduleToHour24?: number;
};
