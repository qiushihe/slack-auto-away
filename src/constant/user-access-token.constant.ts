export const userAccessTokenS3StorageKey = (userId: string): string =>
  `user-access-token-${userId}.txt`;
