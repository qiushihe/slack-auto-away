import {
  DeleteObjectCommand,
  GetObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
  S3ServiceException
} from "@aws-sdk/client-s3";

import { INDEX_PREFIX, IndexName } from "~src/constant/user-data.constant";
import { NamespacedLogger } from "~src/util/logger.util";
import { promisedFn } from "~src/util/promise.util";

type GetPaginatedIndexedUserIdsOptions = {
  maxKeys?: number;
  continuationToken?: string;
};

const _getPaginatedIndexedUserIds = async (
  logger: NamespacedLogger,
  s3: S3Client,
  bucketName: string,
  indexName: IndexName,
  options?: GetPaginatedIndexedUserIdsOptions
): Promise<[Error, null, null] | [null, string[], string | null]> => {
  const [listObjectsErr, listObjectsRes] = await promisedFn(() =>
    s3.send(
      new ListObjectsV2Command({
        Bucket: bucketName,
        Prefix: `${INDEX_PREFIX}${indexName}/`,
        MaxKeys: options?.maxKeys,
        ContinuationToken: options?.continuationToken
      })
    )
  );
  if (listObjectsErr) {
    logger.error(
      `Error listing paginated ${indexName} index files from S3: ${listObjectsErr.message}`
    );
    return [listObjectsErr, null, null];
  }

  const indexedKeys = (listObjectsRes?.Contents || [])
    .map((obj) => `${obj.Key || ""}`)
    .filter((key) => key.trim().length > 0)
    .filter((item, itemIndex, allItems) => allItems.indexOf(item) === itemIndex)
    .map((key) => key.split("/").reverse()[0]);

  logger.log(`Done listing paginated ${indexName} index files from S3`);
  return [null, indexedKeys, listObjectsRes?.NextContinuationToken || null];
};

export type GetIndexedUserIdsOptions = Omit<GetPaginatedIndexedUserIdsOptions, "continuationToken">;

export const getIndexedUserIds = async (
  logger: NamespacedLogger,
  s3: S3Client,
  bucketName: string,
  indexName: IndexName,
  options?: GetIndexedUserIdsOptions
): Promise<[Error, null] | [null, string[]]> => {
  let continuationToken: string | undefined = undefined;
  let allUserIds: string[] = [];

  while (true) {
    const [userIdsErr, userIds, token] = await _getPaginatedIndexedUserIds(
      logger,
      s3,
      bucketName,
      indexName,
      { ...options, continuationToken }
    );
    if (userIdsErr) {
      return [userIdsErr, null];
    }

    allUserIds = [...allUserIds, ...userIds];

    if (!token) {
      break;
    }

    continuationToken = token;
  }

  return [null, allUserIds];
};

export const addUserIdToIndex = async (
  logger: NamespacedLogger,
  s3: S3Client,
  bucketName: string,
  indexName: IndexName,
  userId: string
): Promise<Error | null> => {
  const [putObjectErr] = await promisedFn(() =>
    s3.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: `${INDEX_PREFIX}${indexName}/${userId}`,
        Body: `${indexName}:${userId}`
      })
    )
  );
  if (putObjectErr) {
    logger.error(`Error adding user ID ${userId} to ${indexName} index: ${putObjectErr.message}`);
    return putObjectErr;
  }

  return null;
};

export const removeUserIdFromIndex = async (
  logger: NamespacedLogger,
  s3: S3Client,
  bucketName: string,
  indexName: IndexName,
  userId: string
): Promise<Error | null> => {
  const [deleteObjectErr] = await promisedFn(() =>
    s3.send(
      new DeleteObjectCommand({
        Bucket: bucketName,
        Key: `${INDEX_PREFIX}${indexName}/${userId}`
      })
    )
  );
  if (deleteObjectErr) {
    logger.error(
      `Error removing user ID ${userId} from ${indexName} index: ${deleteObjectErr.message}`
    );
    return deleteObjectErr;
  }

  return null;
};

export const isUserIdIndexed = async (
  logger: NamespacedLogger,
  s3: S3Client,
  bucketName: string,
  indexName: IndexName,
  userId: string
): Promise<[Error, null] | [null, boolean]> => {
  const [getObjectErr, getObjectRes] = await promisedFn(() =>
    s3.send(
      new GetObjectCommand({
        Bucket: bucketName,
        Key: `${INDEX_PREFIX}${indexName}/${userId}`
      })
    )
  );
  if (getObjectErr) {
    if ((getObjectErr as S3ServiceException).name === "NoSuchKey") {
      // Ignore the error for when the user data file doesn't exist, because in
      // that case it just means the user ID is not indexed.
      logger.warn(`User ID index file does not exist`);
      return [null, false];
    } else {
      logger.error(
        `Error getting user ID ${userId} from ${indexName} index: ${getObjectErr.message}`
      );
      return [getObjectErr, null];
    }
  }

  return [null, (getObjectRes?.ContentLength || 0) > 0];
};
