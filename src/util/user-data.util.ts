import {
  DeleteObjectCommand,
  GetObjectCommand,
  GetObjectCommandOutput,
  PutObjectCommand,
  S3Client,
  S3ServiceException
} from "@aws-sdk/client-s3";

import { userDataS3StorageKey } from "~src/constant/s3.constant";
import { NamespacedLogger } from "~src/util/logger.util";
import { promisedFn } from "~src/util/promise.util";

// This structure should be kept flat so object spread can effectively merge old/new data without
// having to worry about deep cloning.
export type UserData = {
  userId: string;
  authToken?: string;
  scheduleFromHour24?: number;
  scheduleToHour24?: number;
  timezoneName?: string;
};

export const getUserData = async (
  logger: NamespacedLogger,
  s3: S3Client,
  bucketName: string,
  userId: string
): Promise<[Error, null] | [null, UserData | null]> => {
  const [getDataFileErr, getDataFileRes] = await promisedFn(() =>
    s3.send(
      new GetObjectCommand({
        Bucket: bucketName,
        Key: userDataS3StorageKey(userId)
      })
    )
  );
  if (getDataFileErr) {
    logger.error(`Error getting data file from S3: ${getDataFileErr.message}`);
    return [getDataFileErr, null];
  }
  logger.log(`Done getting data file from S3`);

  if (!getDataFileRes.Body) {
    logger.error(`Data file response missing body`);
    return [new Error("Response missing body"), null];
  }

  const [dataStringError, dataString] = await promisedFn(
    (body: NonNullable<GetObjectCommandOutput["Body"]>) => body.transformToString("utf-8"),
    getDataFileRes.Body
  );
  if (dataStringError) {
    logger.error(`Error getting data string: ${dataStringError.message}`);
    return [dataStringError, null];
  }

  const [parsedDataErr, parsedData] = await promisedFn(
    async (str: string) => JSON.parse(str) as UserData,
    dataString
  );
  if (parsedDataErr) {
    logger.error(`Error parsing data string: ${parsedDataErr.message}`);
    return [parsedDataErr, null];
  }

  return [null, parsedData];
};

export const setUserData = async (
  logger: NamespacedLogger,
  s3: S3Client,
  bucketName: string,
  userId: string,
  newUserData: Omit<Partial<UserData>, "userId">
): Promise<Error | null> => {
  const [existingUserDataErr, existingUserData] = await getUserData(logger, s3, bucketName, userId);
  if (existingUserDataErr) {
    if ((existingUserDataErr as S3ServiceException).name === "NoSuchKey") {
      // Ignore the error for when the user data file doesn't exist, because in
      // that case we're just going to create the data file anyway.
      logger.warn(`User data file does not exist`);
    } else {
      logger.warn(`Error getting existing user data: ${existingUserDataErr.message}`);
      return existingUserDataErr;
    }
  }

  const [storeDataErr] = await promisedFn(
    (id: string, userData: UserData) =>
      s3.send(
        new PutObjectCommand({
          Bucket: bucketName,
          Key: userDataS3StorageKey(id),
          Body: JSON.stringify(userData)
        })
      ),
    userId,
    { ...(existingUserData || {}), ...newUserData, userId }
  );
  if (storeDataErr) {
    logger.error(`Error storing user data: ${storeDataErr.message}`);
    return storeDataErr;
  }

  logger.log(`Done storing user data`);
  return null;
};

export const deleteUserData = async (
  logger: NamespacedLogger,
  s3: S3Client,
  bucketName: string,
  userId: string
): Promise<Error | null> => {
  const [existingUserDataErr, existingUserData] = await getUserData(logger, s3, bucketName, userId);
  if (existingUserDataErr) {
    if ((existingUserDataErr as S3ServiceException).name === "NoSuchKey") {
      // Ignore the error for when the user data file doesn't exist, because in
      // that case this function will exit due to the early return below.
      logger.warn(`User data file does not exist`);
    } else {
      logger.warn(`Error getting existing user data: ${existingUserDataErr.message}`);
      return existingUserDataErr;
    }
  }

  if (!existingUserData) {
    return null;
  }

  const [deleteDataErr] = await promisedFn(
    (id: string) =>
      s3.send(
        new DeleteObjectCommand({
          Bucket: bucketName,
          Key: userDataS3StorageKey(id)
        })
      ),
    userId
  );
  if (deleteDataErr) {
    logger.error(`Error deleting user data: ${deleteDataErr.message}`);
    return deleteDataErr;
  }

  logger.log(`Done deleting user data`);
  return null;
};
