export const userAccessTokenS3StorageKey = (userId: string): string =>
  `user-access-token-${userId}.txt`;

export const userScheduleS3StorageKey = (userId: string): string => `user-schedule-${userId}.txt`;
